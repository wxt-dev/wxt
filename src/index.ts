import { BuildOutput, ExviteDevServer, InlineConfig } from './types';
import { getInternalConfig } from './utils/getInternalConfig';
import { findEntrypoints } from './utils/findEntrypoints';
import { buildEntrypoints } from './utils/buildEntrypoints';
import { generateMainfest, writeManifest } from './utils/manifest';
import { printBuildSummary } from './utils/printBuildSummary';
import fs from 'fs-extra';
import { generateTypesDir } from './utils/generateTypesDir';

export { version } from '../package.json';
export * from './types/external';
export * from './utils/defineConfig';
import pc from 'picocolors';

/**
 * Bundles the extension for production. Returns a promise of the build result.
 */
export async function build(config: InlineConfig): Promise<BuildOutput> {
  const internalConfig = await getInternalConfig(config, 'build');
  const verb = internalConfig.command === 'serve' ? 'Prerendering' : 'Building';
  const target = `${internalConfig.browser}-mv${internalConfig.manifestVersion}`;
  internalConfig.logger.info(
    `${verb} ${pc.cyan(target)} for ${pc.cyan(internalConfig.mode)}`,
  );

  // Cleanup
  await fs.rm(internalConfig.outDir, { recursive: true, force: true });
  await fs.ensureDir(internalConfig.outDir);

  // Build
  const entrypoints = await findEntrypoints(internalConfig);
  await generateTypesDir(entrypoints, internalConfig);
  const output = await buildEntrypoints(entrypoints, internalConfig);

  // Write manifest
  const manifest = await generateMainfest(entrypoints, output, internalConfig);
  await writeManifest(manifest, output, internalConfig);

  // Post-build
  internalConfig.logger.success('Entrypoints built');
  await printBuildSummary(output, internalConfig);

  return output;
}

export async function createServer(
  config: InlineConfig,
): Promise<ExviteDevServer> {
  const internalConfig = await getInternalConfig(config, 'serve');
  const entrypoints = await findEntrypoints(internalConfig);
  await buildEntrypoints(entrypoints, internalConfig);

  throw Error('Not implemented');
}
