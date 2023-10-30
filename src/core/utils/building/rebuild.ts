import type { Manifest } from 'webextension-polyfill';
import { BuildOutput, EntrypointGroup, InternalConfig } from '~/types';
import { findEntrypoints } from './find-entrypoints';
import { generateTypesDir } from './generate-wxt-dir';
import { buildEntrypoints } from './build-entrypoints';
import { generateMainfest, writeManifest } from '~/core/utils/manifest';

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
  const { default: ora } = await import('ora');
  const spinner = ora(`Preparing...`).start();

  // Update types directory with new files and types
  const allEntrypoints = await findEntrypoints(config);
  await generateTypesDir(allEntrypoints, config).catch((err) => {
    config.logger.warn('Failed to update .wxt directory:', err);
    // Throw the error if doing a regular build, don't for dev mode.
    if (config.command === 'build') throw err;
  });

  // Build and merge the outputs
  const newOutput = await buildEntrypoints(entrypointGroups, config, spinner);
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

  // Stop the spinner and remove it from the CLI output
  spinner.clear().stop();

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
