import { InlineConfig } from '~/types';
import { dirname, resolve } from 'node:path';
import fs from 'fs-extra';
import { kebabCaseAlphanumeric } from '~/core/utils/strings';
import { getPackageJson } from '~/core/utils/package';
import { formatDuration } from '~/core/utils/time';
import { printFileList } from '~/core/utils/log/printFileList';
import { internalBuild } from '~/core/utils/building';
import { registerWxt, wxt } from './wxt';
import JSZip from 'jszip';
import { glob } from 'fast-glob';
import path from 'node:path';
import {
  downloadPrivatePackage,
  getPrivatePackages,
} from './utils/private-packages';
import { getPackageManager } from './utils/package-manager';
import { minimatch } from 'minimatch';

/**
 * Build and zip the extension for distribution.
 * @param config Optional config that will override your `<root>/wxt.config.ts`.
 * @returns A list of all files included in the ZIP.
 */
export async function zip(config?: InlineConfig): Promise<string[]> {
  await registerWxt('build', config);
  const output = await internalBuild();

  const start = Date.now();
  wxt.logger.info('Zipping extension...');
  const zipFiles: string[] = [];

  const projectName =
    wxt.config.zip.name ??
    kebabCaseAlphanumeric(
      (await getPackageJson())?.name || dirname(process.cwd()),
    );
  const applyTemplate = (template: string): string =>
    template
      .replaceAll('{{name}}', projectName)
      .replaceAll('{{browser}}', wxt.config.browser)
      .replaceAll(
        '{{version}}',
        output.manifest.version_name ?? output.manifest.version,
      )
      .replaceAll('{{manifestVersion}}', `mv${wxt.config.manifestVersion}`);

  await fs.ensureDir(wxt.config.outBaseDir);

  // ZIP output directory

  const outZipFilename = applyTemplate(wxt.config.zip.artifactTemplate);
  const outZipPath = resolve(wxt.config.outBaseDir, outZipFilename);
  await zipDir(wxt.config.outDir, outZipPath);
  zipFiles.push(outZipPath);

  // ZIP sources for Firefox

  if (wxt.config.browser === 'firefox') {
    // Download private packages
    const pm = await getPackageManager();
    const privatePackages = (await getPrivatePackages(wxt.config)).map(
      (pkg) => ({
        ...pkg,
        path: path.resolve(
          wxt.config.wxtDir,
          'packages',
          `${pkg.name}_${pkg.version}.tgz`,
        ),
      }),
    );
    for (const pkg of privatePackages) {
      wxt.logger.debug(
        `Downloading private package: ${pkg.name}@${pkg.version} from ${pkg.url}`,
      );
      await downloadPrivatePackage(pkg, pkg.path);
    }

    // Zip source directory
    const sourcesZipFilename = applyTemplate(wxt.config.zip.sourcesTemplate);
    const sourcesZipPath = resolve(wxt.config.outBaseDir, sourcesZipFilename);
    await zipDir(wxt.config.zip.sourcesRoot, sourcesZipPath, {
      include: wxt.config.zip.includeSources,
      exclude: wxt.config.zip.excludeSources,

      async transform(file, content) {
        if (file !== 'package.json') return;

        // Add resolutions to `package.json` for downloaded package
        const json = JSON.parse(content);
        pm.addResolutions(
          json,
          privatePackages.map((pkg) => ({
            name: pkg.name,
            value: path.relative(wxt.config.zip.sourcesRoot, pkg.path),
          })),
        );
        return JSON.stringify(json, null, 2);
      },
      async additionalWork(archive) {
        const md = await getSourceCodeReviewMarkdown();
        archive.file('SOURCE_CODE_REVIEW.md', md);
        if (pm.name === 'pnpm')
          archive.file('.npmrc', 'shamefully-hoist=true\n');
      },
    });
    zipFiles.push(sourcesZipPath);
  }

  await printFileList(
    wxt.logger.success,
    `Zipped extension in ${formatDuration(Date.now() - start)}`,
    wxt.config.outBaseDir,
    zipFiles,
  );

  return zipFiles;
}

async function zipDir(
  directory: string,
  outputPath: string,
  options?: {
    include?: string[];
    exclude?: string[];
    transform?: (
      file: string,
      content: string,
    ) => Promise<string | undefined | void> | string | undefined | void;
    additionalWork?: (archive: JSZip) => Promise<void> | void;
  },
): Promise<void> {
  const archive = new JSZip();
  const files = (
    await glob('**/*', {
      cwd: directory,
      onlyFiles: true,
    })
  ).filter((relativePath) => {
    return (
      wxt.config.zip.includeSources.some((pattern) =>
        minimatch(relativePath, pattern),
      ) ||
      !wxt.config.zip.excludeSources.some((pattern) =>
        minimatch(relativePath, pattern),
      )
    );
  });
  for (const file of files) {
    const absolutePath = path.resolve(directory, file);
    if (file.endsWith('.json')) {
      const content = await fs.readFile(absolutePath, 'utf-8');
      archive.file(
        file,
        (await options?.transform?.(file, content)) || content,
      );
    } else {
      const content = await fs.readFile(absolutePath);
      archive.file(file, content);
    }
  }
  await options?.additionalWork?.(archive);
  const buffer = await archive.generateAsync({ type: 'base64' });
  await fs.writeFile(outputPath, buffer, 'base64');
}

async function getSourceCodeReviewMarkdown(): Promise<string> {
  const pm = await getPackageManager();
  const pathToRoot =
    path.relative(wxt.config.root, wxt.config.zip.sourcesRoot) || '.';

  // Add a custom SOURCE_CODE_REVIEW.md file
  return `# Source Code Review

To build the extension, follow these steps:

\`\`\`sh
${pm.name} install
./node_modules/.bin/wxt zip ${pathToRoot} -b ${wxt.config.browser} --mv${wxt.config.manifestVersion}
\`\`\`
`;
}
