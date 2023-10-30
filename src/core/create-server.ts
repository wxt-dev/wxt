import {
  BuildStepOutput,
  EntrypointGroup,
  InlineConfig,
  InternalConfig,
  WxtDevServer,
} from '~/types';
import * as vite from 'vite';
import type { Scripting } from 'webextension-polyfill';
import {
  getEntrypointBundlePath,
  getEntrypointOutputFile,
  resolvePerBrowserOption,
} from '~/core/utils/entrypoints';
import {
  getContentScriptCssFiles,
  getContentScriptsCssMap,
} from '~/core/utils/manifest';
import {
  internalBuild,
  getInternalConfig,
  detectDevChanges,
  rebuild,
} from '~/core/utils/building';
import { createExtensionRunner } from '~/core/runners';
import { consola } from 'consola';
import { Mutex } from 'async-mutex';
import pc from 'picocolors';
import { relative } from 'node:path';

/**
 * Creates a dev server and pre-builds all the files that need to exist before loading the extension.
 *
 * @example
 * const server = await wxt.createServer({
 *   // Enter config...
 * });
 * await server.start();
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

async function getServerInfo(): Promise<ServerInfo> {
  const { default: getPort, portNumbers } = await import('get-port');
  const port = await getPort({ port: portNumbers(3000, 3010) });
  const hostname = 'localhost';
  const origin = `http://${hostname}:${port}`;
  const serverConfig: vite.InlineConfig = {
    server: {
      origin,
    },
  };

  return {
    port,
    hostname,
    origin,
    viteServerConfig: serverConfig,
  };
}

async function setupServer(
  serverInfo: ServerInfo,
  config: InternalConfig,
): Promise<WxtDevServer> {
  const runner = await createExtensionRunner(config);

  const viteServer = await vite.createServer(
    vite.mergeConfig(serverInfo, await config.vite(config.env)),
  );

  const start = async () => {
    await viteServer.listen(server.port);
    config.logger.success(`Started dev server @ ${serverInfo.origin}`);

    server.currentOutput = await internalBuild(config);
    await runner.openBrowser(config);
  };

  const reloadExtension = () => {
    viteServer.ws.send('wxt:reload-extension');
  };
  const reloadPage = (path: string) => {
    // Can't use Vite's built-in "full-reload" event because it doesn't like our paths, it expects
    // paths ending in "/index.html"
    viteServer.ws.send('wxt:reload-page', path);
  };
  const reloadContentScript = (
    contentScript: Omit<Scripting.RegisteredContentScript, 'id'>,
  ) => {
    viteServer.ws.send('wxt:reload-content-script', contentScript);
  };

  const server: WxtDevServer = {
    ...viteServer,
    start,
    currentOutput: {
      manifest: {
        manifest_version: 3,
        name: '',
        version: '',
      },
      publicAssets: [],
      steps: [],
    },
    port: serverInfo.port,
    hostname: serverInfo.hostname,
    origin: serverInfo.origin,
    reloadExtension,
    reloadPage,
    reloadContentScript,
  };

  return server;
}

/**
 * From the server, tell the client to reload content scripts from the provided build step outputs.
 */
function reloadContentScripts(
  steps: BuildStepOutput[],
  config: InternalConfig,
  server: WxtDevServer,
) {
  if (config.manifestVersion === 3) {
    steps.forEach((step) => {
      const entry = step.entrypoints;
      if (Array.isArray(entry) || entry.type !== 'content-script') return;

      const js = [getEntrypointBundlePath(entry, config.outDir, '.js')];
      const cssMap = getContentScriptsCssMap(server.currentOutput, [entry]);
      const css = getContentScriptCssFiles([entry], cssMap);

      server.reloadContentScript({
        allFrames: resolvePerBrowserOption(
          entry.options.allFrames,
          config.browser,
        ),
        excludeMatches: resolvePerBrowserOption(
          entry.options.excludeMatches,
          config.browser,
        ),
        matches: resolvePerBrowserOption(entry.options.matches, config.browser),
        runAt: resolvePerBrowserOption(entry.options.runAt, config.browser),
        // @ts-expect-error: Chrome accepts this, not typed in webextension-polyfill (https://developer.chrome.com/docs/extensions/reference/scripting/#type-RegisteredContentScript)
        world: resolvePerBrowserOption(entry.options.world, config.browser),
        js,
        css,
      });
    });
  } else {
    server.reloadExtension();
  }
}

function reloadHtmlPages(
  groups: EntrypointGroup[],
  server: WxtDevServer,
  config: InternalConfig,
) {
  groups.flat().forEach((entry) => {
    const path = getEntrypointBundlePath(entry, config.outDir, '.html');
    server.reloadPage(path);
  });
}

interface ServerInfo {
  port: number;
  hostname: string;
  origin: string;
  viteServerConfig: vite.InlineConfig;
}
