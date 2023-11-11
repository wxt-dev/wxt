import archiver, { Archiver } from 'archiver';
import { InlineConfig, InternalConfig } from '~/types';
import { dirname, resolve } from 'node:path';
import fs from 'fs-extra';
import { kebabCaseAlphanumeric } from '~/core/utils/strings';
import { getPackageJson } from '~/core/utils/package';
import { formatDuration } from '~/core/utils/time';
import { printFileList } from '~/core/utils/log/printFileList';
import { getInternalConfig, internalBuild } from '~/core/utils/building';
// import archiver, { Archiver } from 'archiver';
// import { InlineConfig, InternalConfig } from '~/types';
// import { dirname, relative, resolve } from 'node:path';
// import fs, { outputFile } from 'fs-extra';
// import { kebabCaseAlphanumeric } from '~/core/utils/strings';
// import { getPackageJson } from '~/core/utils/package';
// import { minimatch } from 'minimatch';
// import { formatDuration } from '~/core/utils/time';
// import { printFileList } from '~/core/utils/log/printFileList';
// import { getInternalConfig, internalBuild } from '~/core/utils/building';
// import { glob } from 'fast-glob';
// import path from 'node:path';
// import { normalizePath } from './utils/paths';
// import archiver, { Archiver } from 'archiver';

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
  await zipDir(internalConfig, internalConfig.outDir, outZipPath);
  zipFiles.push(outZipPath);

  // ZIP sources for Firefox

  // if (internalConfig.browser === 'firefox') {
  //   const sourcesZipFilename = applyTemplate(
  //     internalConfig.zip.sourcesTemplate,
  //   );
  //   const sourcesZipPath = resolve(
  //     internalConfig.outBaseDir,
  //     sourcesZipFilename,
  //   );
  //   const files = await glob('**/*', {
  //     cwd: internalConfig.root,
  //     ignore: internalConfig.zip.ignoredSources,
  //   });
  //   await zipdir(internalConfig.zip.sourcesRoot, {
  //     saveTo: sourcesZipPath,
  //     filter(path) {
  //       const relativePath = relative(internalConfig.zip.sourcesRoot, path);
  //       const matchedPattern = internalConfig.zip.ignoredSources.find(
  //         (pattern) => minimatch(relativePath, pattern),
  //       );
  //       return matchedPattern == null;
  //     },
  //   });
  //   zipFiles.push(sourcesZipPath);
  // }

  await printFileList(
    internalConfig.logger.success,
    `Zipped extension in ${formatDuration(Date.now() - start)}`,
    internalConfig.outBaseDir,
    zipFiles,
  );

  return zipFiles;
}

function zipDir(
  config: InternalConfig,
  directory: string,
  outputPath: string,
  additionalWork?: (archive: Archiver) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip');

    archive.on('warning', config.logger.warn);
    archive.on('error', (err) => {
      config.logger.error(err);
      reject(err);
    });
    archive.on('close', () => resolve());

    // Create output stream
    const outputStream = fs.createWriteStream(outputPath);
    archive.pipe(outputStream);

    // Add files
    archive.glob('**/*', {
      cwd: directory,
      skip: ['**/node_modules', '**/.git'],
    });

    additionalWork?.(archive);

    archive.finalize().then(resolve);
  });
}
