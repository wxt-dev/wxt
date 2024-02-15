import {
  BuildStepOutput,
  EntrypointGroup,
  InlineConfig,
  ServerInfo,
  WxtDevServer,
} from '~/types';
import {
  getEntrypointBundlePath,
  resolvePerBrowserOption,
} from '~/core/utils/entrypoints';
import {
  getContentScriptCssFiles,
  getContentScriptsCssMap,
} from '~/core/utils/manifest';
import {
  internalBuild,
  detectDevChanges,
  rebuild,
  findEntrypoints,
} from '~/core/utils/building';
import { createExtensionRunner } from '~/core/runners';
import { consola } from 'consola';
import { Mutex } from 'async-mutex';
import pc from 'picocolors';
import { relative } from 'node:path';
import { registerWxt, wxt } from './wxt';

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
    server.currentOutput = await internalBuild();

    // Add file watchers for files not loaded by the dev server
    const additionalFiles = server.currentOutput.steps
      .flatMap((step, i) => {
        if (Array.isArray(step.entrypoints) && i === 0) {
          // Dev server is already watching all HTML/esm files
          return [];
        }

        return step.chunks.flatMap((chunk) => {
          if (chunk.type === 'asset') return [];
          return chunk.moduleIds;
        });
      })
      .filter(
        (file) => !file.includes('node_modules') && !file.startsWith('\x00'),
      );
    console.log('Adding files:', additionalFiles);
    server.watcher.add(additionalFiles);

    // Open browser after everything is ready to go.
    await runner.openBrowser();
  };

  /**
   * Stops the previous runner, grabs the latest config, and recreates the runner.
   */
  const closeAndRecreateRunner = async () => {
    await runner.closeBrowser();
    await wxt.reloadConfig();
    runner = await createExtensionRunner();
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
      wxt.logger.success(`Started dev server @ ${serverInfo.origin}`);
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
      await runner.openBrowser();
    },
  };

  await registerWxt('serve', inlineConfig, server);

  let [runner, builderServer] = await Promise.all([
    createExtensionRunner(),
    wxt.config.builder.createServer(server),
  ]);

  // Register content scripts for the first time after the background starts up since they're not
  // listed in the manifest
  server.ws.on('wxt:background-initialized', () => {
    if (server.currentOutput == null) return;
    reloadContentScripts(server.currentOutput.steps, server);
  });

  // Listen for file changes and reload different parts of the extension accordingly
  const reloadOnChange = createFileReloader(server);
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
function createFileReloader(server: WxtDevServer) {
  const fileChangedMutex = new Mutex();
  const changeQueue: Array<[string, string]> = [];

  return async (event: string, path: string) => {
    await wxt.reloadConfig();

    // Here, "path" is a non-normalized path (ie: C:\\users\\... instead of C:/users/...)
    if (path.startsWith(wxt.config.outBaseDir)) return;
    changeQueue.push([event, path]);

    await fileChangedMutex.runExclusive(async () => {
      if (server.currentOutput == null) return;

      const fileChanges = changeQueue
        .splice(0, changeQueue.length)
        .map(([_, file]) => file);
      if (fileChanges.length === 0) return;

      const changes = detectDevChanges(fileChanges, server.currentOutput);
      if (changes.type === 'no-change') return;

      if (changes.type === 'full-restart') {
        wxt.logger.info('Config changed, restarting server...');
        server.restart();
        return;
      }

      if (changes.type === 'browser-restart') {
        wxt.logger.info('Runner config changed, restarting browser...');
        server.restartBrowser();
        return;
      }

      // Log the entrypoints that were effected
      wxt.logger.info(
        `Changed: ${Array.from(new Set(fileChanges))
          .map((file) => pc.dim(relative(wxt.config.root, file)))
          .join(', ')}`,
      );

      // Rebuild entrypoints on change
      const allEntrypoints = await findEntrypoints();
      const { output: newOutput } = await rebuild(
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
          consola.success(`Reloaded extension`);
          break;
        case 'html-reload':
          const { reloadedNames } = reloadHtmlPages(
            changes.rebuildGroups,
            server,
          );
          consola.success(`Reloaded: ${getFilenameList(reloadedNames)}`);
          break;
        case 'content-script-reload':
          reloadContentScripts(changes.changedSteps, server);
          const rebuiltNames = changes.rebuildGroups
            .flat()
            .map((entry) => entry.name);
          consola.success(`Reloaded: ${getFilenameList(rebuiltNames)}`);
          break;
      }
    });
  };
}

/**
 * From the server, tell the client to reload content scripts from the provided build step outputs.
 */
function reloadContentScripts(steps: BuildStepOutput[], server: WxtDevServer) {
  if (wxt.config.manifestVersion === 3) {
    steps.forEach((step) => {
      if (server.currentOutput == null) return;

      const entry = step.entrypoints;
      if (Array.isArray(entry) || entry.type !== 'content-script') return;

      const js = [getEntrypointBundlePath(entry, wxt.config.outDir, '.js')];
      const cssMap = getContentScriptsCssMap(server.currentOutput, [entry]);
      const css = getContentScriptCssFiles([entry], cssMap);

      server.reloadContentScript({
        allFrames: resolvePerBrowserOption(
          entry.options.allFrames,
          wxt.config.browser,
        ),
        excludeMatches: resolvePerBrowserOption(
          entry.options.excludeMatches,
          wxt.config.browser,
        ),
        matches: resolvePerBrowserOption(
          entry.options.matches,
          wxt.config.browser,
        ),
        runAt: resolvePerBrowserOption(entry.options.runAt, wxt.config.browser),
        // @ts-expect-error: Chrome accepts this, not typed in webextension-polyfill (https://developer.chrome.com/docs/extensions/reference/scripting/#type-RegisteredContentScript)
        world: resolvePerBrowserOption(entry.options.world, wxt.config.browser),
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
): { reloadedNames: string[] } {
  // groups might contain other files like background/content scripts, and we only care about the HTMl pages
  const htmlEntries = groups
    .flat()
    .filter((entry) => entry.inputPath.endsWith('.html'));

  htmlEntries.forEach((entry) => {
    const path = getEntrypointBundlePath(entry, wxt.config.outDir, '.html');
    server.reloadPage(path);
  });

  return {
    reloadedNames: htmlEntries.map((entry) => entry.name),
  };
}

function getFilenameList(names: string[]): string {
  return names
    .map((name) => {
      return pc.cyan(name);
    })
    .join(pc.dim(', '));
}
