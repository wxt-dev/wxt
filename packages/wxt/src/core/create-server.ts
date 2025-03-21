import { debounce } from 'perfect-debounce';
import {
  BuildStepOutput,
  EntrypointGroup,
  InlineConfig,
  ServerInfo,
  WxtDevServer,
} from '../types';
import { getEntrypointBundlePath, isHtmlEntrypoint } from './utils/entrypoints';
import {
  getContentScriptCssFiles,
  getContentScriptsCssMap,
} from './utils/manifest';
import {
  internalBuild,
  detectDevChanges,
  rebuild,
  findEntrypoints,
} from './utils/building';
import { createExtensionRunner } from './runners';
import { Mutex } from 'async-mutex';
import pc from 'picocolors';
import { relative, resolve } from 'node:path';
import { deinitWxtModules, initWxtModules, registerWxt, wxt } from './wxt';
import { unnormalizePath } from './utils/paths';
import {
  getContentScriptJs,
  mapWxtOptionsToRegisteredContentScript,
} from './utils/content-scripts';
import { createKeyboardShortcuts } from './keyboard-shortcuts';
import {
  isBabelSyntaxError,
  isModuleNotFoundError,
  isViteLoadFallbackError,
  isVitePluginError,
  logBabelSyntaxError,
  parseModuleNotFoundError,
} from './utils/error';

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
  await registerWxt('serve', inlineConfig);

  wxt.server = await createServerInternal();
  await wxt.hooks.callHook('server:created', wxt, wxt.server);
  return wxt.server;
}

async function createServerInternal(): Promise<WxtDevServer> {
  const getServerInfo = (): ServerInfo => {
    const { port, hostname } = wxt.config.dev.server!;
    return {
      port,
      hostname,
      origin: `http://${hostname}:${port}`,
    };
  };

  let [runner, builderServer] = await Promise.all([
    createExtensionRunner(),
    wxt.builder.createServer(getServerInfo()),
  ]);

  // Used to track if modules need to be re-initialized
  let wasStopped = false;

  // Server instance must be created first so its reference can be added to the internal config used
  // to pre-render entrypoints
  const server: WxtDevServer = {
    get hostname() {
      return getServerInfo().hostname;
    },
    get port() {
      return getServerInfo().port;
    },
    get origin() {
      return getServerInfo().origin;
    },
    get watcher() {
      return builderServer.watcher;
    },
    get ws() {
      return builderServer.ws;
    },
    currentOutput: undefined,
    async start() {
      if (wasStopped) {
        await wxt.reloadConfig();
        runner = await createExtensionRunner();
        builderServer = await wxt.builder.createServer(getServerInfo());
        await initWxtModules();
      }

      await builderServer.listen();
      wxt.logger.success(`Started dev server @ ${server.origin}`);
      await wxt.hooks.callHook('server:started', wxt, server);

      // Register content scripts for the first time after the background starts
      // up since they're not listed in the manifest.
      // Add listener before opening the browser to guarantee it is present when
      // the extension sends back the initialization message.
      server.ws.on('wxt:background-initialized', () => {
        if (server.currentOutput == null) return;
        reloadContentScripts(server.currentOutput.steps, server);
      });

      const { success, errorFiles } = await buildAndOpenBrowser();
      errorFiles?.forEach((file) => {
        server.watcher.add(file);
      });

      // Listen for file changes and reload different parts of the extension accordingly
      const reloadOnChange = createFileReloader(server, errorFiles);
      server.watcher.on('all', reloadOnChange);

      if (success) {
        keyboardShortcuts.start();
        keyboardShortcuts.printHelp({
          canReopenBrowser:
            !wxt.config.runnerConfig.config.disabled && !!runner.canOpen?.(),
        });
      }
    },

    async stop() {
      wasStopped = true;
      keyboardShortcuts.stop();
      await runner.closeBrowser();
      await builderServer.close();
      await wxt.hooks.callHook('server:closed', wxt, server);

      deinitWxtModules();
      server.currentOutput = undefined;
    },
    async restart() {
      await server.stop();
      await server.start();
    },
    transformHtml(url, html, originalUrl) {
      return builderServer.transformHtml(url, html, originalUrl);
    },
    reloadContentScript(payload) {
      server.ws.send('wxt:reload-content-script', payload);
    },
    reloadPage(path) {
      server.ws.send('wxt:reload-page', path);
    },
    reloadExtension() {
      server.ws.send('wxt:reload-extension');
    },
    async restartBrowser() {
      await runner.closeBrowser();
      keyboardShortcuts.stop();
      await wxt.reloadConfig();
      runner = await createExtensionRunner();
      await runner.openBrowser();
      keyboardShortcuts.start();
    },
  };
  const keyboardShortcuts = createKeyboardShortcuts(server);

  const buildAndOpenBrowser = async () => {
    try {
      // Build after starting the dev server so it can be used to transform HTML files
      server.currentOutput = await internalBuild();
    } catch (err) {
      const errorFiles: string[] = [];
      // TODO: support syntax errors from ESBuild and others.
      if (err instanceof SyntaxError && isBabelSyntaxError(err)) {
        logBabelSyntaxError(err);
        wxt.logger.info('Waiting for syntax error to be fixed...');
        errorFiles.push(err.id);
      } else if (err instanceof Error && isModuleNotFoundError(err)) {
        const details = parseModuleNotFoundError(err);
        if (details && details.importer.startsWith('/@fs/')) {
          wxt.logger.error(err.message);
          wxt.logger.info('Waiting for import specifier to be fixed...');
          errorFiles.push(details.importer.slice(5));
        }
      } else if (
        err instanceof Error &&
        isVitePluginError(err) &&
        isViteLoadFallbackError(err) &&
        err.pluginCode === 'ENOENT'
      ) {
        // This error message comes from Rollup: https://github.com/rollup/rollup/blob/384d5333fbc3d8918b41856822376da2a65ccaa3/src/ModuleLoader.ts#L288-L289
        const match = err.message.match(
          // "Could not load /path/to/xyz.ts (imported by src/module.ts)"
          /^Could not load (.*) \(imported by (.*)\)/,
        );
        if (match) {
          wxt.logger.error(err.message);
          wxt.logger.info('Waiting for missing file to be added...');

          // The file that couldn't be loaded is an absolute path, but the importer is relative and
          // so it needs to be resolved.
          errorFiles.push(match[1], resolve(match[2]));
        }
      }
      // If we can't blame at least 1 file, the build failed irrecoverably.
      if (!errorFiles.length) {
        throw err;
      }
      return {
        success: false,
        errorFiles,
      };
    }

    // Add file watchers for files not loaded by the dev server. See
    // https://github.com/wxt-dev/wxt/issues/428#issuecomment-1944731870
    try {
      server.watcher.add(getExternalOutputDependencies(server));
    } catch (err) {
      wxt.config.logger.warn('Failed to register additional file paths:', err);
    }

    // Open browser after everything is ready to go.
    await runner.openBrowser();

    return {
      success: true,
    };
  };

  builderServer.on?.('close', () => keyboardShortcuts.stop());

  return server;
}

/**
 * Returns a function responsible for reloading different parts of the extension when a file
 * changes.
 */
function createFileReloader(server: WxtDevServer, errorFiles?: string[]) {
  const fileChangedMutex = new Mutex();
  const changeQueue: Array<[string, string]> = [];

  const cb = async (event: string, path: string) => {
    changeQueue.push([event, path]);

    const reloading = fileChangedMutex.runExclusive(async () => {
      const fileChanges = changeQueue
        .splice(0, changeQueue.length)
        .map(([_, file]) => file);
      if (fileChanges.length === 0) return;

      await wxt.reloadConfig();

      const changes = detectDevChanges(
        fileChanges,
        server.currentOutput,
        errorFiles,
      );
      if (changes.type === 'no-change') return;

      if (changes.type === 'full-restart') {
        wxt.logger.info(`${changes.cause} changed, restarting server...`);
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
      try {
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
            wxt.logger.success(`Reloaded extension`);
            break;
          case 'html-reload':
            const { reloadedNames } = reloadHtmlPages(
              changes.rebuildGroups,
              server,
            );
            wxt.logger.success(`Reloaded: ${getFilenameList(reloadedNames)}`);
            break;
          case 'content-script-reload':
            reloadContentScripts(changes.changedSteps, server);

            const rebuiltNames = changes.rebuildGroups
              .flat()
              .map((entry) => entry.name);
            wxt.logger.success(`Reloaded: ${getFilenameList(rebuiltNames)}`);
            break;
        }
      } catch {
        // Catch build errors instead of crashing. Don't log error either, builder should have already logged it
      }
    });

    await reloading.catch((error) => {
      if (!isBabelSyntaxError(error)) {
        throw error;
      }
      // Log syntax errors without crashing the server.
      logBabelSyntaxError(error);
    });
  };

  return debounce(cb, wxt.config.dev.server!.watchDebounce, {
    leading: true,
    trailing: false,
  });
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

      const js = getContentScriptJs(wxt.config, entry);
      const cssMap = getContentScriptsCssMap(server.currentOutput, [entry]);
      const css = getContentScriptCssFiles([entry], cssMap);

      server.reloadContentScript({
        registration: entry.options.registration,
        contentScript: mapWxtOptionsToRegisteredContentScript(
          entry.options,
          js,
          css,
        ),
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
  const htmlEntries = groups.flat().filter(isHtmlEntrypoint);

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

/**
 * Based on the current build output, return a list of files that are:
 * 1. Not in node_modules
 * 2. Not inside project root
 */
function getExternalOutputDependencies(server: WxtDevServer) {
  return (
    server.currentOutput?.steps
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
      )
      .map(unnormalizePath)
      .filter((file) => !file.startsWith(wxt.config.root)) ?? []
  );
}
