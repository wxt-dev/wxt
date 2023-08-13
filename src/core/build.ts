import { Manifest } from 'webextension-polyfill';
import { BuildOutput } from './types';
import { buildEntrypoints } from './build/buildEntrypoints';
import { findEntrypoints } from './build/findEntrypoints';
import { generateTypesDir } from './build/generateTypesDir';
import { InternalConfig, EntrypointGroup } from './types';
import { generateMainfest, writeManifest } from './utils/manifest';
import pc from 'picocolors';
import * as vite from 'vite';
import fs from 'fs-extra';
import { groupEntrypoints } from './utils/groupEntrypoints';
import { formatDuration } from './utils/formatDuration';
import { printBuildSummary } from './log/printBuildSummary';

/**
 * Builds the extension based on an internal config.
 *
 * This function:
 * 1. Cleans the output directory
 * 2. Executes the rebuild function with a blank previous output so everything is built (see
 *    `rebuild` for more details)
 * 3. Prints the summary
 */
export async function buildInternal(
  config: InternalConfig,
): Promise<BuildOutput> {
  const verb = config.command === 'serve' ? 'Pre-rendering' : 'Building';
  const target = `${config.browser}-mv${config.manifestVersion}`;
  config.logger.info(
    `${verb} ${pc.cyan(target)} for ${pc.cyan(config.mode)} with ${pc.green(
      `Vite ${vite.version}`,
    )}`,
  );
  const startTime = Date.now();

  // Cleanup
  await fs.rm(config.outDir, { recursive: true, force: true });
  await fs.ensureDir(config.outDir);

  const entrypoints = await findEntrypoints(config);
  const groups = groupEntrypoints(entrypoints);
  const { output } = await rebuild(config, groups, undefined);

  // Post-build
  await printBuildSummary(
    config.logger.success,
    `Built extension in ${formatDuration(Date.now() - startTime)}`,
    output,
    config,
  );

  return output;
}

/**
 * Given a configuration, list of entrypoints, and an existing, partial output, build the
 * entrypoints and merge the new output with the existing output.
 *
 * This function will:
 * 1. Generate the .wxt directory's types
 * 2. Build the `entrypointGroups` (and copies public files)
 * 3. Generate the latest manifest for all entrypoints
 * 4. Write the new manifest to the file system
 */
export async function rebuild(
  config: InternalConfig,
  entrypointGroups: EntrypointGroup[],
  existingOutput: Omit<BuildOutput, 'manifest'> = {
    steps: [],
    publicAssets: [],
  },
): Promise<{ output: BuildOutput; manifest: Manifest.WebExtensionManifest }> {
  // Update types directory with new files and types
  const allEntrypoints = await findEntrypoints(config);
  await generateTypesDir(allEntrypoints, config).catch((err) => {
    config.logger.warn('Failed to update .wxt directory:', err);
    // Throw the error if doing a regular build, don't for dev mode.
    if (config.command === 'build') throw err;
  });

  // Build and merge the outputs
  const newOutput = await buildEntrypoints(entrypointGroups, config);
  const mergedOutput: Omit<BuildOutput, 'manifest'> = {
    steps: [...existingOutput.steps, ...newOutput.steps],
    publicAssets: [...existingOutput.publicAssets, ...newOutput.publicAssets],
  };

  const newManifest = await generateMainfest(
    allEntrypoints,
    mergedOutput,
    config,
  );
  const finalOutput: BuildOutput = {
    manifest: newManifest,
    ...newOutput,
  };

  // Write manifest
  await writeManifest(newManifest, finalOutput, config);

  return {
    output: {
      manifest: newManifest,
      steps: [...existingOutput.steps, ...finalOutput.steps],
      publicAssets: [
        ...existingOutput.publicAssets,
        ...finalOutput.publicAssets,
      ],
    },
    manifest: newManifest,
  };
}
