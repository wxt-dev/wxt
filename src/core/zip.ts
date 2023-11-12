import { InlineConfig, InternalConfig } from '~/types';
import { dirname, resolve } from 'node:path';
import fs from 'fs-extra';
import { kebabCaseAlphanumeric } from '~/core/utils/strings';
import { getPackageJson } from '~/core/utils/package';
import { formatDuration } from '~/core/utils/time';
import { printFileList } from '~/core/utils/log/printFileList';
import { getInternalConfig, internalBuild } from '~/core/utils/building';
import JSZip from 'jszip';
import { glob } from 'fast-glob';
import path from 'node:path';
import {
  downloadPrivatePackage,
  getPrivatePackages,
} from './utils/private-packages';
import { getPackageManager } from './utils/package-manager';

/**
 * Build and zip the extension for distribution.
 * @param config Opitonal config that will override your `<root>/wxt.config.ts`.
 * @returns A list of all files included in the ZIP.
 */
export async function zip(config?: InlineConfig): Promise<string[]> {
  const internalConfig = await getInternalConfig(config ?? {}, 'build');
  const output = await internalBuild(internalConfig);

  const start = Date.now();
  internalConfig.logger.info('Zipping extension...');
  const zipFiles: string[] = [];

  const projectName =
    internalConfig.zip.name ??
    kebabCaseAlphanumeric(
      (await getPackageJson(internalConfig))?.name || dirname(process.cwd()),
    );
  const applyTemplate = (template: string): string =>
    template
      .replaceAll('{{name}}', projectName)
      .replaceAll('{{browser}}', internalConfig.browser)
      .replaceAll(
        '{{version}}',
        output.manifest.version_name ?? output.manifest.version,
      )
      .replaceAll('{{manifestVersion}}', `mv${internalConfig.manifestVersion}`);

  await fs.ensureDir(internalConfig.outBaseDir);

  // ZIP output directory

  const outZipFilename = applyTemplate(internalConfig.zip.artifactTemplate);
  const outZipPath = resolve(internalConfig.outBaseDir, outZipFilename);
  await zipDir(internalConfig.outDir, outZipPath);
  zipFiles.push(outZipPath);

  // ZIP sources for Firefox

  if (internalConfig.browser === 'firefox') {
    // Download private packages
    const pm = await getPackageManager(internalConfig);
    const privatePackages = (await getPrivatePackages(internalConfig)).map(
      (pkg) => ({
        ...pkg,
        path: path.resolve(
          internalConfig.wxtDir,
          'packages',
          `${pkg.name}_${pkg.version}.tgz`,
        ),
      }),
    );
    for (const pkg of privatePackages) {
      internalConfig.logger.debug(
        `Downloading private package: ${pkg.name}@${pkg.version} from ${pkg.url}`,
      );
      await downloadPrivatePackage(pkg, pkg.path);
    }

    // Zip source directory
    const sourcesZipFilename = applyTemplate(
      internalConfig.zip.sourcesTemplate,
    );
    const sourcesZipPath = resolve(
      internalConfig.outBaseDir,
      sourcesZipFilename,
    );
    await zipDir(internalConfig.zip.sourcesRoot, sourcesZipPath, {
      ignore: internalConfig.zip.ignoredSources,
      async transform(file, content) {
        if (file !== 'package.json') return;

        // Add resolutions to `package.json` for downloaded package
        const json = JSON.parse(content);
        pm.addResolutions(
          json,
          privatePackages.map((pkg) => ({
            name: pkg.name,
            value: path.relative(internalConfig.zip.sourcesRoot, pkg.path),
          })),
        );
        return JSON.stringify(json, null, 2);
      },
      async additionalWork(archive) {
        const md = await getSourceCodeReviewMarkdown(internalConfig);
        archive.file('SOURCE_CODE_REVIEW.md', md);
        if (pm.name === 'pnpm')
          archive.file('.npmrc', 'shamefully-hoist=true\n');
      },
    });
    zipFiles.push(sourcesZipPath);
  }

  await printFileList(
    internalConfig.logger.success,
    `Zipped extension in ${formatDuration(Date.now() - start)}`,
    internalConfig.outBaseDir,
    zipFiles,
  );

  return zipFiles;
}

async function zipDir(
  directory: string,
  outputPath: string,
  options?: {
    ignore?: string[];
    transform?: (
      file: string,
      content: string,
    ) => Promise<string | undefined | void> | string | undefined | void;
    additionalWork?: (archive: JSZip) => Promise<void> | void;
  },
): Promise<void> {
  const archive = new JSZip();
  const files = await glob('**/*', {
    cwd: directory,
    ignore: options?.ignore,
    onlyFiles: true,
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

async function getSourceCodeReviewMarkdown(
  config: InternalConfig,
): Promise<string> {
  const pm = await getPackageManager(config);
  const pathToRoot = path.relative(config.root, config.zip.sourcesRoot) || '.';

  // Add a custom SOURCE_CODE_REVIEW.md file
  return `# Source Code Review

To build the extension, follow these steps:

\`\`\`sh
${pm.name} install
./node_modules/.bin/wxt zip ${pathToRoot} -b ${config.browser} --mv${config.manifestVersion}
\`\`\`
`;
}
