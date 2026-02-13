import chokidar from 'chokidar';
import { InlineConfig, ServerInfo, WxtDevServer } from '../types';
import { internalBuild } from './utils/building';
import { createExtensionRunner } from './runners';
import { deinitWxtModules, initWxtModules, registerWxt, wxt } from './wxt';
import { unnormalizePath } from './utils/paths';
import { createKeyboardShortcuts } from './keyboard-shortcuts';
import { isBabelSyntaxError, logBabelSyntaxError } from './utils/syntax-errors';
import {
  createFileReloader,
  reloadContentScripts,
} from './utils/create-file-reloader';

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
    const { host, port, origin } = wxt.config.dev.server!;
    return { host, port, origin };
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
    get host() {
      return getServerInfo().host;
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
      const hostInfo =
        server.host === 'localhost' ? '' : ` (listening on ${server.host})`;
      wxt.logger.success(`Started dev server @ ${server.origin}${hostInfo}`);
      await wxt.hooks.callHook('server:started', wxt, server);

      // Register content scripts for the first time after the background starts
      // up since they're not listed in the manifest.
      // Add listener before opening the browser to guarantee it is present when
      // the extension sends back the initialization message.
      server.ws.on('wxt:background-initialized', () => {
        if (server.currentOutput == null) return;
        reloadContentScripts(server.currentOutput.steps, server);
      });

      await buildAndOpenBrowser();

      // Listen for file changes and reload different parts of the extension accordingly
      const reloadOnChange = createFileReloader(server);
      server.watcher.on('all', async (...args) => {
        await reloadOnChange(args[0], args[1]);

        // Restart keyboard shortcuts after file is changed - for some reason they stop working.
        keyboardShortcuts.start();
      });

      keyboardShortcuts.printHelp({
        canReopenBrowser:
          !wxt.config.runnerConfig.config.disabled && !!runner.canOpen?.(),
      });
    },

    async stop() {
      wasStopped = true;
      keyboardShortcuts.stop();
      await runner.closeBrowser?.();
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
      await runner.closeBrowser?.();
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
      if (!isBabelSyntaxError(err)) {
        throw err;
      }
      logBabelSyntaxError(err);
      wxt.logger.info('Waiting for syntax error to be fixed...');
      await new Promise<void>((resolve) => {
        const watcher = chokidar.watch(err.id, { ignoreInitial: true });
        watcher.on('all', () => {
          watcher.close();
          wxt.logger.info('Syntax error resolved, rebuilding...');
          resolve();
        });
      });
      return buildAndOpenBrowser();
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
  };

  builderServer.on?.('close', () => keyboardShortcuts.stop());

  return server;
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
