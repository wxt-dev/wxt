import {
  BuildOutput,
  WxtDevServer,
  InlineConfig,
  InternalConfig,
} from './core/types';
import { getInternalConfig } from './core/utils/getInternalConfig';
import { findEntrypoints } from './core/build/findEntrypoints';
import { buildEntrypoints } from './core/build/buildEntrypoints';
import { generateMainfest, writeManifest } from './core/utils/manifest';
import { printBuildSummary } from './core/log/printBuildSummary';
import fs from 'fs-extra';
import { generateTypesDir } from './core/build/generateTypesDir';
import pc from 'picocolors';
import * as vite from 'vite';
import { findOpenPort } from './core/utils/findOpenPort';
import { formatDuration } from './core/utils/formatDuration';
import { createWebExtRunner } from './core/runners/createWebExtRunner';

export { version } from '../package.json';
export * from './core/types/external';
export * from './core/utils/defineConfig';
export * from './core/utils/defineRunnerConfig';

/**
 * Bundles the extension for production. Returns a promise of the build result.
 */
export async function build(config: InlineConfig): Promise<BuildOutput> {
  const internalConfig = await getInternalConfig(config, 'build');
  return await buildInternal(internalConfig);
}

export async function createServer(
  config?: InlineConfig,
): Promise<WxtDevServer> {
  const port = await findOpenPort(3000, 3010);
  const hostname = 'localhost';
  const origin = `http://${hostname}:${port}`;
  const serverConfig: vite.InlineConfig = {
    server: {
      origin,
    },
  };
  const internalConfig = await getInternalConfig(
    vite.mergeConfig(serverConfig, config ?? {}),
    'serve',
  );
  const runner = createWebExtRunner();

  const viteServer = await vite.createServer(internalConfig.vite);
  const server: WxtDevServer = {
    ...viteServer,
    async listen(port, isRestart) {
      const res = await viteServer.listen(port, isRestart);

      if (!isRestart) {
        internalConfig.logger.success(`Started dev server @ ${origin}`);

        internalConfig.logger.info('Opening browser...');
        await runner.openBrowser(internalConfig);
        internalConfig.logger.success('Opened!');
      }

      return res;
    },
    logger: internalConfig.logger,
    port,
    hostname,
    origin,
  };
  internalConfig.logger.info('Created dev server');

  internalConfig.server = server;
  await buildInternal(internalConfig);

  return server;
}

async function buildInternal(config: InternalConfig): Promise<BuildOutput> {
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

  // Build
  const entrypoints = await findEntrypoints(config);
  await generateTypesDir(entrypoints, config);
  const output = await buildEntrypoints(entrypoints, config);

  // Write manifest
  const manifest = await generateMainfest(entrypoints, output, config);
  await writeManifest(manifest, output, config);

  // Post-build
  config.logger.success(
    `Built extension in ${formatDuration(Date.now() - startTime)}`,
  );
  await printBuildSummary(output, config);

  return output;
}
