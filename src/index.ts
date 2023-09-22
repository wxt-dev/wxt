import { BuildOutput, WxtDevServer, InlineConfig } from './core/types';
import { getInternalConfig } from './core/utils/getInternalConfig';
import pc from 'picocolors';
import { detectDevChanges } from './core/utils/detectDevChanges';
import { Mutex } from 'async-mutex';
import { consola } from 'consola';
import { relative } from 'node:path';
import { getEntrypointOutputFile } from './core/utils/entrypoints';
import { buildInternal, rebuild } from './core/build';
import {
  getServerInfo,
  reloadContentScripts,
  reloadHtmlPages,
  setupServer,
} from './core/server';

export * from './core/clean';
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

/**
 * Creates a dev server, pre-builds all the files that need to exist to load the extension, and open
 * the browser with the extension installed.
 */
export async function createServer(
  config?: InlineConfig,
): Promise<WxtDevServer> {
  const serverInfo = await getServerInfo();

  const getLatestInternalConfig = async () => {
    return getInternalConfig(
      {
        ...config,
        vite: () => serverInfo.viteServerConfig,
      },
      'serve',
    );
  };

  let internalConfig = await getLatestInternalConfig();
  const server = await setupServer(serverInfo, internalConfig);
  internalConfig.server = server;

  const fileChangedMutex = new Mutex();
  const changeQueue: Array<[string, string]> = [];

  server.ws.on('wxt:background-initialized', () => {
    // Register content scripts for the first time since they're not listed in the manifest
    reloadContentScripts(server.currentOutput.steps, internalConfig, server);
  });

  server.watcher.on('all', async (event, path, _stats) => {
    // Here, "path" is a non-normalized path (ie: C:\\users\\... instead of C:/users/...)
    if (path.startsWith(internalConfig.outBaseDir)) return;
    changeQueue.push([event, path]);

    await fileChangedMutex.runExclusive(async () => {
      const fileChanges = changeQueue.splice(0, changeQueue.length);
      if (fileChanges.length === 0) return;

      const changes = detectDevChanges(fileChanges, server.currentOutput);
      if (changes.type === 'no-change') return;

      // Log the entrypoints that were effected
      internalConfig.logger.info(
        `Changed: ${Array.from(new Set(fileChanges.map((change) => change[1])))
          .map((file) => pc.dim(relative(internalConfig.root, file)))
          .join(', ')}`,
      );
      const rebuiltNames = changes.rebuildGroups
        .flat()
        .map((entry) => {
          return pc.cyan(
            relative(internalConfig.outDir, getEntrypointOutputFile(entry, '')),
          );
        })
        .join(pc.dim(', '));

      // Get latest config and Rebuild groups with changes
      internalConfig = await getLatestInternalConfig();
      internalConfig.server = server;
      const { output: newOutput } = await rebuild(
        internalConfig,
        // TODO: this excludes new entrypoints, so they're not built until the dev command is restarted
        changes.rebuildGroups,
        changes.cachedOutput,
      );
      server.currentOutput = newOutput;

      // Perform reloads
      switch (changes.type) {
        case 'extension-reload':
          server.reloadExtension();
          break;
        case 'html-reload':
          reloadHtmlPages(changes.rebuildGroups, server, internalConfig);
          break;
        case 'content-script-reload':
          reloadContentScripts(changes.changedSteps, internalConfig, server);
          break;
      }
      consola.success(`Reloaded: ${rebuiltNames}`);
    });
  });

  return server;
}
