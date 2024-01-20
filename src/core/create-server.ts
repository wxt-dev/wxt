import {
  BuildStepOutput,
  EntrypointGroup,
  InlineConfig,
  InternalConfig,
  ServerInfo,
  WxtDevServer,
} from '~/types';
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
  findEntrypoints,
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
  inlineConfig?: InlineConfig,
): Promise<WxtDevServer> {
  const port = await getPort();
  const hostname = 'localhost';
  const origin = `http://${hostname}:${port}`;
  const serverInfo: ServerInfo = {
    port,
    hostname,
    origin,
  };

  const buildAndOpenBrowser = async () => {
    // Build after starting the dev server so it can be used to transform HTML files
    server.currentOutput = await internalBuild(config);

    // Open browser after everything is ready to go.
    await runner.openBrowser(config);
  };

  /**
   * Stops the previous runner, grabs the latest config, and recreates the runner.
   */
  const closeAndRecreateRunner = async () => {
    await runner.closeBrowser();
    config = await getLatestConfig();
    runner = await createExtensionRunner(config);
  };

  // Server instance must be created first so its reference can be added to the internal config used
  // to pre-render entrypoints
  const server: WxtDevServer = {
    ...serverInfo,
    get watcher() {
      return builderServer.watcher;
    },
    get ws() {
      return builderServer.ws;
    },
    currentOutput: undefined,
    async start() {
      await builderServer.listen();
      config.logger.success(`Started dev server @ ${serverInfo.origin}`);
      await buildAndOpenBrowser();
    },
    async stop() {
      await runner.closeBrowser();
      await builderServer.close();
    },
    async restart() {
      await closeAndRecreateRunner();
      await buildAndOpenBrowser();
    },
    transformHtml(url, html, originalUrl) {
      return builderServer.transformHtml(url, html, originalUrl);
    },
    reloadContentScript(contentScript) {
      server.ws.send('wxt:reload-content-script', contentScript);
    },
    reloadPage(path) {
      server.ws.send('wxt:reload-page', path);
    },
    reloadExtension() {
      server.ws.send('wxt:reload-extension');
    },
    async restartBrowser() {
      await closeAndRecreateRunner();
      await runner.openBrowser(config);
    },
  };

  const getLatestConfig = () =>
    getInternalConfig(inlineConfig ?? {}, 'serve', server);
  let config = await getLatestConfig();

  let [runner, builderServer] = await Promise.all([
    createExtensionRunner(config),
    config.builder.createServer(server),
  ]);

  // Register content scripts for the first time after the background starts up since they're not
  // listed in the manifest
  server.ws.on('wxt:background-initialized', () => {
    if (server.currentOutput == null) return;
    reloadContentScripts(server.currentOutput.steps, config, server);
  });

  // Listen for file changes and reload different parts of the extension accordingly
  const reloadOnChange = createFileReloader({
    server,
    getLatestConfig,
    updateConfig(newConfig) {
      config = newConfig;
    },
  });
  server.watcher.on('all', reloadOnChange);

  return server;
}

async function getPort(): Promise<number> {
  const { default: getPort, portNumbers } = await import('get-port');
  return await getPort({ port: portNumbers(3000, 3010) });
}

/**
 * Returns a function responsible for reloading different parts of the extension when a file
 * changes.
 */
function createFileReloader(options: {
  server: WxtDevServer;
  getLatestConfig: () => Promise<InternalConfig>;
  updateConfig: (config: InternalConfig) => void;
}) {
  const { server, getLatestConfig, updateConfig } = options;
  const fileChangedMutex = new Mutex();
  const changeQueue: Array<[string, string]> = [];

  return async (event: string, path: string) => {
    const config = await getLatestConfig();
    updateConfig(config);

    // Here, "path" is a non-normalized path (ie: C:\\users\\... instead of C:/users/...)
    if (path.startsWith(config.outBaseDir)) return;
    changeQueue.push([event, path]);

    await fileChangedMutex.runExclusive(async () => {
      if (server.currentOutput == null) return;

      const fileChanges = changeQueue
        .splice(0, changeQueue.length)
        .map(([_, file]) => file);
      if (fileChanges.length === 0) return;

      const changes = detectDevChanges(
        config,
        fileChanges,
        server.currentOutput,
      );
      if (changes.type === 'no-change') return;

      if (changes.type === 'full-restart') {
        config.logger.info('Config changed, restarting server...');
        server.restart();
        return;
      }

      if (changes.type === 'browser-restart') {
        config.logger.info('Runner config changed, restarting browser...');
        server.restartBrowser();
        return;
      }

      // Log the entrypoints that were effected
      config.logger.info(
        `Changed: ${Array.from(new Set(fileChanges))
          .map((file) => pc.dim(relative(config.root, file)))
          .join(', ')}`,
      );

      const rebuiltNames = changes.rebuildGroups
        .flat()
        .map((entry) => {
          return pc.cyan(
            relative(config.outDir, getEntrypointOutputFile(entry, '')),
          );
        })
        .join(pc.dim(', '));

      // Rebuild entrypoints on change
      const allEntrypoints = await findEntrypoints(config);
      const { output: newOutput } = await rebuild(
        config,
        allEntrypoints,
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
          reloadHtmlPages(changes.rebuildGroups, server, config);
          break;
        case 'content-script-reload':
          reloadContentScripts(changes.changedSteps, config, server);
          break;
      }
      consola.success(`Reloaded: ${rebuiltNames}`);
    });
  };
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
      if (server.currentOutput == null) return;

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
