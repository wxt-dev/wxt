import { BuildOutput, InternalConfig } from './types';
import zipdir from 'zip-dir';
import { dirname, relative, resolve } from 'node:path';
import fs from 'fs-extra';
import { kebabCaseAlphanumeric } from './utils/strings';
import { getPackageJson } from './utils/package';
import { minimatch } from 'minimatch';
import { formatDuration } from './utils/formatDuration';
import { printFileList } from './log/printFileList';

/**
 * Zip the extension for distribution. Does not build, just zips the output that should exist for
 * the given config.
 *
 * Returns a list of ZIP files that were created.
 */
export async function zipExtension(
  config: InternalConfig,
  buildOutput: BuildOutput,
): Promise<string[]> {
  const start = Date.now();
  config.logger.info('Zipping extension...');
  const zipFiles: string[] = [];

  const projectName =
    config.zip.name ??
    kebabCaseAlphanumeric(
      (await getPackageJson(config))?.name || dirname(process.cwd()),
    );
  const applyTemplate = (template: string): string =>
    template
      .replaceAll('{{name}}', projectName)
      .replaceAll('{{browser}}', config.browser)
      .replaceAll(
        '{{version}}',
        buildOutput.manifest.version_name ?? buildOutput.manifest.version,
      )
      .replaceAll('{{manifestVersion}}', `mv${config.manifestVersion}`);

  await fs.ensureDir(config.outBaseDir);

  // ZIP output directory

  const outZipFilename = applyTemplate(config.zip.artifactTemplate);
  const outZipPath = resolve(config.outBaseDir, outZipFilename);
  await zipdir(config.outDir, {
    saveTo: outZipPath,
  });
  zipFiles.push(outZipPath);

  // ZIP sources for Firefox

  if (config.browser === 'firefox') {
    const sourcesZipFilename = applyTemplate(config.zip.sourcesTemplate);
    const sourcesZipPath = resolve(config.outBaseDir, sourcesZipFilename);
    await zipdir(config.zip.sourcesRoot, {
      saveTo: sourcesZipPath,
      filter(path) {
        const relativePath = relative(config.zip.sourcesRoot, path);
        const matchedPattern = config.zip.ignoredSources.find((pattern) =>
          minimatch(relativePath, pattern),
        );
        return matchedPattern == null;
      },
    });
    zipFiles.push(sourcesZipPath);
  }

  config.logger.success(
    `Zipped extension in ${formatDuration(Date.now() - start)}`,
  );
  await printFileList(config.logger.log, config.outBaseDir, zipFiles);

  return zipFiles;
}
