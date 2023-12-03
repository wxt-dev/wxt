import type * as vite from 'vite';
import {
  BuildStepOutput,
  ConfigEnv,
  Entrypoint,
  InlineConfig,
  InternalConfig,
  UserConfig,
  WxtBuilder,
  WxtBuilderServer,
} from '~/types';
import * as wxtPlugins from './plugins';
import { getEntrypointBundlePath } from '~/core/utils/entrypoints';
import type { Scripting } from 'webextension-polyfill';

export type WxtViteConfig = Omit<
  vite.UserConfig,
  'root' | 'configFile' | 'mode'
>;

declare module '~/types' {
  interface InlineConfig {
    /**
     * Return custom Vite options from a function. See
     * <https://vitejs.dev/config/shared-options.html>.
     *
     * [`root`](#root), [`configFile`](#configfile), and [`mode`](#mode) should be set in WXT's config
     * instead of Vite's.
     *
     * This is a function because any vite plugins added need to be recreated for each individual
     * build step, incase they have internal state causing them to fail when reused.
     */
    vite?: (env: ConfigEnv) => WxtViteConfig | Promise<WxtViteConfig>;
  }
}

export async function craeteViteBuilder(
  inlineConfig: InlineConfig,
  userConfig: UserConfig,
  wxtConfig: Omit<InternalConfig, 'builder'>,
): Promise<WxtBuilder> {
  const vite = await import('vite');

  /**
   * Returns the base vite config shared by all builds based on the inline and user config.
   */
  const getBaseConfig = async () => {
    const resolvedInlineConfig =
      (await inlineConfig.vite?.(wxtConfig.env)) ?? {};
    const resolvedUserConfig = (await userConfig.vite?.(wxtConfig.env)) ?? {};

    const config: vite.InlineConfig = vite.mergeConfig(
      resolvedUserConfig,
      resolvedInlineConfig,
    );

    config.root = wxtConfig.root;
    config.configFile = false;
    config.logLevel = 'warn';
    config.mode = wxtConfig.mode;

    config.build ??= {};
    config.build.outDir = wxtConfig.outDir;
    config.build.emptyOutDir = false;

    config.plugins ??= [];
    config.plugins.push(
      wxtPlugins.download(wxtConfig),
      wxtPlugins.devHtmlPrerender(wxtConfig),
      wxtPlugins.unimport(wxtConfig),
      wxtPlugins.virtualEntrypoint('background', wxtConfig),
      wxtPlugins.virtualEntrypoint('content-script', wxtConfig),
      wxtPlugins.virtualEntrypoint('unlisted-script', wxtConfig),
      wxtPlugins.devServerGlobals(wxtConfig),
      wxtPlugins.tsconfigPaths(wxtConfig),
      wxtPlugins.noopBackground(),
      wxtPlugins.globals(wxtConfig),
      wxtPlugins.excludeBrowserPolyfill(wxtConfig),
    );
    if (wxtConfig.analysis.enabled) {
      config.plugins.push(wxtPlugins.bundleAnalysis());
    }

    return config;
  };

  /**
   * Return the basic config for building an entrypoint in [lib mode](https://vitejs.dev/guide/build.html#library-mode).
   */
  const getLibModeConfig = (entrypoint: Entrypoint): vite.InlineConfig => {
    const isVirtual = [
      'background',
      'content-script',
      'unlisted-script',
    ].includes(entrypoint.type);
    const entry = isVirtual
      ? `virtual:wxt-${entrypoint.type}?${entrypoint.inputPath}`
      : entrypoint.inputPath;

    const plugins: NonNullable<vite.UserConfig['plugins']> = [
      wxtPlugins.libModeGlobals(entrypoint),
    ];
    if (
      entrypoint.type === 'content-script-style' ||
      entrypoint.type === 'unlisted-style'
    ) {
      plugins.push(wxtPlugins.cssEntrypoints(entrypoint, wxtConfig));
    }

    const libMode: vite.UserConfig = {
      mode: wxtConfig.mode,
      plugins,
      build: {
        lib: {
          entry,
          formats: ['iife'],
          name: '_',
          fileName: entrypoint.name,
        },
        rollupOptions: {
          output: {
            // There's only a single output for this build, so we use the desired bundle path for the
            // entry output (like "content-scripts/overlay.js")
            entryFileNames: getEntrypointBundlePath(
              entrypoint,
              wxtConfig.outDir,
              '.js',
            ),
            // Output content script CSS to `content-scripts/`, but all other scripts are written to
            // `assets/`.
            assetFileNames: ({ name }) => {
              if (
                entrypoint.type === 'content-script' &&
                name?.endsWith('css')
              ) {
                return `content-scripts/${entrypoint.name}.[ext]`;
              } else {
                return `assets/${entrypoint.name}.[ext]`;
              }
            },
          },
        },
      },
      define: {
        // See https://github.com/aklinker1/vite-plugin-web-extension/issues/96
        'process.env.NODE_ENV': JSON.stringify(wxtConfig.mode),
      },
    };
    return libMode;
  };

  /**
   * Return the basic config for building multiple entrypoints in [multi-page mode](https://vitejs.dev/guide/build.html#multi-page-app).
   */
  const getMultiPageConfig = (entrypoints: Entrypoint[]): vite.InlineConfig => {
    return {
      mode: wxtConfig.mode,
      plugins: [
        wxtPlugins.multipageMove(entrypoints, wxtConfig),
        wxtPlugins.multipageModeGlobals(),
      ],
      build: {
        rollupOptions: {
          input: entrypoints.reduce<Record<string, string>>((input, entry) => {
            input[entry.name] = entry.inputPath;
            return input;
          }, {}),
          output: {
            // Include a hash to prevent conflicts
            chunkFileNames: 'chunks/[name]-[hash].js',
            // Include a hash to prevent conflicts
            entryFileNames: 'chunks/[name]-[hash].js',
            // We can't control the "name", so we need a hash to prevent conflicts
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
      },
      define: {},
    };
  };

  return {
    name: 'Vite',
    version: vite.version,
    async build(group) {
      const buildConfig = vite.mergeConfig(
        await getBaseConfig(),
        Array.isArray(group)
          ? getMultiPageConfig(group)
          : getLibModeConfig(group),
      );
      const result = await vite.build(buildConfig);
      return {
        entrypoints: group,
        chunks: getBuildOutputChunks(result),
      };
    },
    async createServer(port) {
      const hostname = 'localhost';
      const origin = `http://${hostname}:${port}`;
      const serverConfig: vite.InlineConfig = {
        server: {
          origin,
        },
      };
      const baseConfig = await getBaseConfig();

      const viteServer = await vite.createServer(
        vite.mergeConfig(baseConfig, serverConfig),
      );

      const listen = async () => {
        await viteServer.listen(server.port);
      };
      const close = async () => {
        await viteServer.close().catch(() => {
          wxtConfig.logger.warn('Server not started yet');
        });
      };
      const restart = async () => {
        await close();
        await listen();
      };

      const server: WxtBuilderServer = {
        listen,
        close,
        restart,
        port,
        hostname,
        origin,
        ws: {
          send(message, payload) {
            return viteServer.ws.send(message, payload);
          },
          on(message, cb) {
            viteServer.ws.on(message, (request) => {
              // TODO: Pass payload correctly
              cb(request);
            });
          },
        },
        watcher: viteServer.watcher,
        // reloadExtension,
        // reloadPage,
        // reloadContentScript,
      };

      return server;
    },
  };
}

function getBuildOutputChunks(
  result: Awaited<ReturnType<typeof vite.build>>,
): BuildStepOutput['chunks'] {
  if ('on' in result) throw Error('wxt does not support vite watch mode.');
  if (Array.isArray(result)) return result.flatMap(({ output }) => output);
  return result.output;
}
