import {
  BuildStepOutput,
  EntrypointGroup,
  InternalConfig,
  WxtDevServer,
} from './types';
import * as vite from 'vite';
import { findOpenPort } from './utils/findOpenPort';
import { Manifest } from 'webextension-polyfill';
import { getEntrypointBundlePath } from './utils/entrypoints';
import { getContentScriptCssFiles } from './utils/manifest';
import { createWebExtRunner } from './runners/createWebExtRunner';
import { buildInternal } from './build';
import { mapWxtOptionsToContentScript } from './utils/content-scripts';

export async function getServerInfo(): Promise<ServerInfo> {
  const port = await findOpenPort(3000, 3010);
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

export async function setupServer(
  serverInfo: ServerInfo,
  config: InternalConfig,
): Promise<WxtDevServer> {
  const runner = createWebExtRunner();

  const viteServer = await vite.createServer(
    vite.mergeConfig(serverInfo, config.vite),
  );

  const start = async () => {
    await viteServer.listen(server.port);
    config.logger.success(`Started dev server @ ${serverInfo.origin}`);

    server.currentOutput = await buildInternal(config);
    config.logger.info('Opening browser...');
    await runner.openBrowser(config);
    config.logger.success('Opened!');
  };

  const reloadExtension = () => {
    viteServer.ws.send('wxt:reload-extension');
  };
  const reloadPage = (path: string) => {
    // Can't use Vite's built-in "full-reload" event because it doesn't like our paths, it expects
    // paths ending in "/index.html"
    viteServer.ws.send('wxt:reload-page', path);
  };
  const reloadContentScript = (contentScript: Manifest.ContentScript) => {
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
export function reloadContentScripts(
  steps: BuildStepOutput[],
  config: InternalConfig,
  server: WxtDevServer,
) {
  if (config.manifestVersion === 3) {
    steps.forEach((step) => {
      const entry = step.entrypoints;
      if (Array.isArray(entry) || entry.type !== 'content-script') return;

      const js = [getEntrypointBundlePath(entry, config.outDir, '.js')];
      const css = getContentScriptCssFiles([entry], server.currentOutput);

      server.reloadContentScript({
        ...mapWxtOptionsToContentScript(entry.options),
        js,
        css,
      });
    });
  } else {
    server.reloadExtension();
  }
}

export function reloadHtmlPages(
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
