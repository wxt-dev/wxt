import {
  BuildOutput,
  ExviteDevServer,
  InlineConfig,
  InternalConfig,
} from './types';
import { getInternalConfig } from './utils/getInternalConfig';
import { findEntrypoints } from './utils/findEntrypoints';
import { buildEntrypoints } from './utils/buildEntrypoints';
import { generateMainfest, writeManifest } from './utils/manifest';
import { printBuildSummary } from './utils/printBuildSummary';
import fs from 'fs-extra';
import { generateTypesDir } from './utils/generateTypesDir';
import pc from 'picocolors';
import * as vite from 'vite';
import { findOpenPort } from './utils/findOpenPort';
import { relative } from 'path';
import { formatDuration } from './utils/formatDuration';

export { version } from '../package.json';
export * from './types/external';
export * from './utils/defineConfig';
/**
 * Bundles the extension for production. Returns a promise of the build result.
 */
export async function build(config: InlineConfig): Promise<BuildOutput> {
  const internalConfig = await getInternalConfig(config, 'build');
  return await buildInternal(internalConfig);
}

export async function createServer(
  config?: InlineConfig,
): Promise<ExviteDevServer> {
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

  const viteServer = await vite.createServer(internalConfig.vite);
  viteServer.middlewares.use(function (req, res, next) {
    internalConfig.logger.log('middleware');
    next();
  });
  viteServer.watcher.on('all', (eventName, path) => {
    if (
      !path.startsWith(internalConfig.srcDir) ||
      path.startsWith(internalConfig.outBaseDir) ||
      path.startsWith(internalConfig.exviteDir)
    )
      return;

    internalConfig.logger.log(
      `${pc.green(eventName + ':')} ${relative(process.cwd(), path)}`,
    );
  });
  const server: ExviteDevServer = {
    ...viteServer,
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
  config.logger.info(`${verb} ${pc.cyan(target)} for ${pc.cyan(config.mode)}`);
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
