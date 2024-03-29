import type * as vite from 'vite';
import {
  BuildStepOutput,
  Entrypoint,
  ResolvedConfig,
  VirtualEntrypointType,
  WxtBuilder,
  WxtBuilderServer,
  WxtDevServer,
} from '~/types';
import * as wxtPlugins from './plugins';
import {
  getEntrypointBundlePath,
  isHtmlEntrypoint,
} from '~/core/utils/entrypoints';

export async function createViteBuilder(
  wxtConfig: ResolvedConfig,
  server?: WxtDevServer,
): Promise<WxtBuilder> {
  const vite = await import('vite');

  /**
   * Returns the base vite config shared by all builds based on the inline and user config.
   */
  const getBaseConfig = async () => {
    const config: vite.InlineConfig = await wxtConfig.vite(wxtConfig.env);

    config.root = wxtConfig.root;
    config.configFile = false;
    config.logLevel = 'warn';
    config.mode = wxtConfig.mode;

    config.build ??= {};
    config.build.outDir = wxtConfig.outDir;
    config.build.emptyOutDir = false;
    // Disable minification for the dev command
    if (config.build.minify == null && wxtConfig.command === 'serve') {
      config.build.minify = false;
    }
    // Enable inline sourcemaps for the dev command (so content scripts have sourcemaps)
    if (config.build.sourcemap == null && wxtConfig.command === 'serve') {
      config.build.sourcemap = 'inline';
    }

    config.plugins ??= [];
    config.plugins.push(
      wxtPlugins.download(wxtConfig),
      wxtPlugins.devHtmlPrerender(wxtConfig, server),
      wxtPlugins.unimport(wxtConfig),
      wxtPlugins.virtualEntrypoint('background', wxtConfig),
      wxtPlugins.virtualEntrypoint('content-script-isolated-world', wxtConfig),
      wxtPlugins.virtualEntrypoint('content-script-main-world', wxtConfig),
      wxtPlugins.virtualEntrypoint('unlisted-script', wxtConfig),
      wxtPlugins.devServerGlobals(wxtConfig, server),
      wxtPlugins.tsconfigPaths(wxtConfig),
      wxtPlugins.noopBackground(),
      wxtPlugins.globals(wxtConfig),
      wxtPlugins.excludeBrowserPolyfill(wxtConfig),
      wxtPlugins.defineImportMeta(),
    );
    if (wxtConfig.analysis.enabled) {
      config.plugins.push(wxtPlugins.bundleAnalysis(wxtConfig));
    }

    return config;
  };

  /**
   * Return the basic config for building an entrypoint in [lib mode](https://vitejs.dev/guide/build.html#library-mode).
   */
  const getLibModeConfig = (entrypoint: Entrypoint): vite.InlineConfig => {
    const entry = getRollupEntry(entrypoint);
    const plugins: NonNullable<vite.UserConfig['plugins']> = [
      wxtPlugins.entrypointGroupGlobals(entrypoint),
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
    const htmlEntrypoints = new Set(
      entrypoints.filter(isHtmlEntrypoint).map((e) => e.name),
    );
    return {
      mode: wxtConfig.mode,
      plugins: [
        wxtPlugins.multipageMove(entrypoints, wxtConfig),
        wxtPlugins.entrypointGroupGlobals(entrypoints),
      ],
      build: {
        rollupOptions: {
          input: entrypoints.reduce<Record<string, string>>((input, entry) => {
            input[entry.name] = getRollupEntry(entry);
            return input;
          }, {}),
          output: {
            // Include a hash to prevent conflicts
            chunkFileNames: 'chunks/[name]-[hash].js',
            entryFileNames: ({ name }) => {
              // HTML main JS files go in the chunks folder
              if (htmlEntrypoints.has(name)) return 'chunks/[name]-[hash].js';
              // Scripts are output in the root folder
              return '[name].js';
            },
            // We can't control the "name", so we need a hash to prevent conflicts
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
      },
    };
  };

  /**
   * Return the basic config for building a sinlge CSS entrypoint in [multi-page mode](https://vitejs.dev/guide/build.html#multi-page-app).
   */
  const getCssConfig = (entrypoint: Entrypoint): vite.InlineConfig => {
    return {
      mode: wxtConfig.mode,
      plugins: [wxtPlugins.entrypointGroupGlobals(entrypoint)],
      build: {
        rollupOptions: {
          input: {
            [entrypoint.name]: entrypoint.inputPath,
          },
          output: {
            assetFileNames: () => {
              if (entrypoint.type === 'content-script-style') {
                return `content-scripts/${entrypoint.name}.[ext]`;
              } else {
                return `assets/${entrypoint.name}.[ext]`;
              }
            },
          },
        },
      },
    };
  };

  return {
    name: 'Vite',
    version: vite.version,
    async build(group) {
      let entryConfig;
      if (Array.isArray(group)) entryConfig = getMultiPageConfig(group);
      else if (group.inputPath.endsWith('.css'))
        entryConfig = getCssConfig(group);
      else entryConfig = getLibModeConfig(group);

      const buildConfig = vite.mergeConfig(await getBaseConfig(), entryConfig);
      const result = await vite.build(buildConfig);
      return {
        entrypoints: group,
        chunks: getBuildOutputChunks(result),
      };
    },
    async createServer(info) {
      const serverConfig: vite.InlineConfig = {
        server: {
          port: info.port,
          strictPort: true,
          host: info.hostname,
          origin: info.origin,
        },
      };
      const baseConfig = await getBaseConfig();
      const viteServer = await vite.createServer(
        vite.mergeConfig(baseConfig, serverConfig),
      );

      const server: WxtBuilderServer = {
        async listen() {
          await viteServer.listen(info.port);
        },
        async close() {
          await viteServer.close();
        },
        transformHtml(...args) {
          return viteServer.transformIndexHtml(...args);
        },
        ws: {
          send(message, payload) {
            return viteServer.ws.send(message, payload);
          },
          on(message, cb) {
            viteServer.ws.on(message, cb);
          },
        },
        watcher: viteServer.watcher,
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

/**
 * Returns the input module ID (virtual or real file) for an entrypoint. The returned string should
 * be passed as an input to rollup.
 */
function getRollupEntry(entrypoint: Entrypoint): string {
  let virtualEntrypointType: VirtualEntrypointType | undefined;
  switch (entrypoint.type) {
    case 'background':
    case 'unlisted-script':
      virtualEntrypointType = entrypoint.type;
      break;
    case 'content-script':
      virtualEntrypointType =
        entrypoint.options.world === 'MAIN'
          ? 'content-script-main-world'
          : 'content-script-isolated-world';
      break;
  }
  return virtualEntrypointType
    ? `virtual:wxt-${virtualEntrypointType}?${entrypoint.inputPath}`
    : entrypoint.inputPath;
}
