import {
  BuildStepOutput,
  EntrypointGroup,
  InlineConfig,
  InternalConfig,
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
  const getLatestConfig = () => getInternalConfig(config ?? {}, 'serve');
  const initialConfig = await getLatestConfig();
  const server = await createWxtDevServer(initialConfig, getLatestConfig);
  initialConfig.server = server;

  return server;
}

export async function createWxtDevServer(
  initialConfig: InternalConfig,
  getLatestConfig: () => Promise<InternalConfig>,
): Promise<WxtDevServer> {
  let config = initialConfig;
  const port = await getPort();
  const [runner, builderServer] = await Promise.all([
    createExtensionRunner(initialConfig),
    initialConfig.builder.createServer(port),
  ]);

  const listen = async () => {
    await builderServer.listen();
    config.logger.success(`Started dev server @ ${builderServer.origin}`);

    // Build after starting the dev server so it can be used to transform HTML files
    server.currentOutput = await internalBuild(config);

    // Open browser after everything is ready to go.
    await runner.openBrowser(config);

    return server;
  };

  const close = async () => {
    await Promise.all([builderServer.close(), runner.closeBrowser()]);
  };

  const restart = async () => {
    await close();
    await listen();
  };

  const server: WxtDevServer = {
    ...builderServer,
    currentOutput: {
      manifest: {
        manifest_version: config.manifestVersion,
        name: '',
        version: '',
      },
      publicAssets: [],
      steps: [],
    },
    listen,
    close,
    restart,
    reloadContentScript(contentScript) {
      server.ws.send('wxt:reload-content-script', contentScript);
    },
    reloadPage(path) {
      server.ws.send('wxt:reload-page', path);
    },
    reloadExtension() {
      server.ws.send('wxt:reload-extension');
    },
  };

  const fileChangedMutex = new Mutex();
  const changeQueue: Array<[string, string]> = [];

  server.ws.on('wxt:background-initialized', () => {
    // Register content scripts for the first time since they're not listed in the manifest
    reloadContentScripts(server.currentOutput.steps, config, server);
  });

  server.watcher.on('all', async (event, path, _stats) => {
    // Here, "path" is a non-normalized path (ie: C:\\users\\... instead of C:/users/...)
    if (path.startsWith(config.outBaseDir)) return;
    changeQueue.push([event, path]);

    await fileChangedMutex.runExclusive(async () => {
      const fileChanges = changeQueue.splice(0, changeQueue.length);
      if (fileChanges.length === 0) return;

      const changes = detectDevChanges(fileChanges, server.currentOutput);
      if (changes.type === 'no-change') return;

      // Log the entrypoints that were effected
      config.logger.info(
        `Changed: ${Array.from(new Set(fileChanges.map((change) => change[1])))
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

      // Get latest config and Rebuild groups with changes
      config = await getLatestConfig();
      config.server = server;
      const { output: newOutput } = await rebuild(
        config,
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
          reloadHtmlPages(changes.rebuildGroups, server, initialConfig);
          break;
        case 'content-script-reload':
          reloadContentScripts(changes.changedSteps, initialConfig, server);
          break;
      }
      consola.success(`Reloaded: ${rebuiltNames}`);
    });
  });

  return server;
}

async function getPort(): Promise<number> {
  const { default: getPort, portNumbers } = await import('get-port');
  return await getPort({ port: portNumbers(3000, 3010) });
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
