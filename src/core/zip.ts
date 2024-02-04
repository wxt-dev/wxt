import { InlineConfig } from '~/types';
import zipdir from 'zip-dir';
import { dirname, relative, resolve } from 'node:path';
import fs from 'fs-extra';
import { kebabCaseAlphanumeric } from '~/core/utils/strings';
import { getPackageJson } from '~/core/utils/package';
import { minimatch } from 'minimatch';
import { formatDuration } from '~/core/utils/time';
import { printFileList } from '~/core/utils/log/printFileList';
import { resolveConfig, internalBuild } from '~/core/utils/building';
import { registerWxt, wxt } from './utils/wxt';

/**
 * Build and zip the extension for distribution.
 * @param config Opitonal config that will override your `<root>/wxt.config.ts`.
 * @returns A list of all files included in the ZIP.
 */
export async function zip(config?: InlineConfig): Promise<string[]> {
  await registerWxt(await resolveConfig(config ?? {}, 'build'));
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
  await zipdir(wxt.config.outDir, {
    saveTo: outZipPath,
  });
  zipFiles.push(outZipPath);

  // ZIP sources for Firefox

  if (wxt.config.browser === 'firefox') {
    const sourcesZipFilename = applyTemplate(wxt.config.zip.sourcesTemplate);
    const sourcesZipPath = resolve(wxt.config.outBaseDir, sourcesZipFilename);
    await zipdir(wxt.config.zip.sourcesRoot, {
      saveTo: sourcesZipPath,
      filter(path) {
        const relativePath = relative(wxt.config.zip.sourcesRoot, path);

        return (
          wxt.config.zip.includeSources.some((pattern) =>
            minimatch(relativePath, pattern),
          ) ||
          !wxt.config.zip.excludeSources.some((pattern) =>
            minimatch(relativePath, pattern),
          )
        );
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
