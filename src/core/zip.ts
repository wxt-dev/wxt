import { InlineConfig } from '~/types';
import path from 'node:path';
import fs from 'fs-extra';
import { kebabCaseAlphanumeric } from '~/core/utils/strings';
import { getPackageJson } from '~/core/utils/package';
import { minimatch } from 'minimatch';
import { formatDuration } from '~/core/utils/time';
import { printFileList } from '~/core/utils/log/printFileList';
import { internalBuild } from '~/core/utils/building';
import { registerWxt, wxt } from './wxt';
import JSZip from 'jszip';
import glob from 'fast-glob';

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
      (await getPackageJson())?.name || path.dirname(process.cwd()),
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
  const outZipPath = path.resolve(wxt.config.outBaseDir, outZipFilename);
  await zipDir(wxt.config.outDir, outZipPath);
  zipFiles.push(outZipPath);

  // ZIP sources for Firefox

  if (wxt.config.browser === 'firefox') {
    const sourcesZipFilename = applyTemplate(wxt.config.zip.sourcesTemplate);
    const sourcesZipPath = path.resolve(
      wxt.config.outBaseDir,
      sourcesZipFilename,
    );
    await zipDir(wxt.config.zip.sourcesRoot, sourcesZipPath, {
      include: wxt.config.zip.includeSources,
      exclude: wxt.config.zip.excludeSources,
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
      // Ignore node_modules, otherwise this glob step takes forever
      ignore: ['**/node_modules'],
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
