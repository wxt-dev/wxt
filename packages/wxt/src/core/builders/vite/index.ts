import type * as vite from 'vite';
import {
  BuildStepOutput,
  Entrypoint,
  EntrypointGroup,
  ResolvedConfig,
  WxtBuilder,
  WxtBuilderServer,
  WxtDevServer,
  WxtHooks,
} from '../../../types';
import * as wxtPlugins from './plugins';
import {
  getEntrypointBundlePath,
  isHtmlEntrypoint,
} from '../../utils/entrypoints';
import {
  VirtualEntrypointType,
  VirtualModuleId,
} from '../../utils/virtual-modules';
import { Hookable } from 'hookable';
import { toArray } from '../../utils/arrays';
import { ViteNodeServer } from 'vite-node/server';
import { ViteNodeRunner } from 'vite-node/client';
import { installSourcemapsSupport } from 'vite-node/source-map';
import { createExtensionEnvironment } from '../../utils/environments';
import { dirname, extname, join, relative } from 'node:path';
import fs from 'fs-extra';
import { normalizePath } from '../../utils/paths';

export async function createViteBuilder(
  wxtConfig: ResolvedConfig,
  hooks: Hookable<WxtHooks>,
  getWxtDevServer?: () => WxtDevServer | undefined,
): Promise<WxtBuilder> {
  const vite = await import('vite');

  /**
   * Returns the base vite config shared by all builds based on the inline and user config.
   */
  const getBaseConfig = async (baseConfigOptions?: {
    excludeAnalysisPlugin?: boolean;
  }) => {
    const config: vite.InlineConfig = await wxtConfig.vite(wxtConfig.env);

    config.root = wxtConfig.root;
    config.configFile = false;
    config.logLevel = 'warn';
    config.mode = wxtConfig.mode;
    config.envPrefix ??= ['VITE_', 'WXT_'];

    config.build ??= {};
    config.publicDir = wxtConfig.publicDir;
    config.build.copyPublicDir = false;
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

    config.server ??= {};
    config.server.watch = {
      ignored: [`${wxtConfig.outBaseDir}/**`, `${wxtConfig.wxtDir}/**`],
    };

    // TODO: Remove once https://github.com/wxt-dev/wxt/pull/1411 is merged
    config.legacy ??= {};
    // @ts-ignore: Untyped option:
    config.legacy.skipWebSocketTokenCheck = true;

    const server = getWxtDevServer?.();

    config.plugins ??= [];
    config.plugins.push(
      wxtPlugins.download(wxtConfig),
      wxtPlugins.devHtmlPrerender(wxtConfig, server),
      wxtPlugins.resolveVirtualModules(wxtConfig),
      wxtPlugins.devServerGlobals(wxtConfig, server),
      wxtPlugins.tsconfigPaths(wxtConfig),
      wxtPlugins.noopBackground(),
      wxtPlugins.globals(wxtConfig),
      wxtPlugins.defineImportMeta(),
      wxtPlugins.wxtPluginLoader(wxtConfig),
      wxtPlugins.resolveAppConfig(wxtConfig),
    );
    if (
      wxtConfig.analysis.enabled &&
      // If included, vite-node entrypoint loader will increment the
      // bundleAnalysis's internal build index tracker, which we don't want
      !baseConfigOptions?.excludeAnalysisPlugin
    ) {
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
    const iifeReturnValueName = wxtConfig.iifeName(entrypoint.name);

    if (
      entrypoint.type === 'content-script-style' ||
      entrypoint.type === 'unlisted-style'
    ) {
      plugins.push(wxtPlugins.cssEntrypoints(entrypoint, wxtConfig));
    }

    if (
      entrypoint.type === 'content-script' ||
      entrypoint.type === 'unlisted-script'
    ) {
      plugins.push(wxtPlugins.iifeFooter(iifeReturnValueName));
    }

    return {
      mode: wxtConfig.mode,
      plugins,
      build: {
        lib: {
          entry,
          formats: ['iife'],
          name: iifeReturnValueName,
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
    } satisfies vite.UserConfig;
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
      plugins: [wxtPlugins.entrypointGroupGlobals(entrypoints)],
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
   * Return the basic config for building a single CSS entrypoint in [multi-page mode](https://vitejs.dev/guide/build.html#multi-page-app).
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

  const createViteNodeImporter = async (paths: string[]) => {
    const baseConfig = await getBaseConfig({
      excludeAnalysisPlugin: true,
    });
    // Disable dep optimization, as recommended by vite-node's README
    baseConfig.optimizeDeps ??= {};
    baseConfig.optimizeDeps.noDiscovery = true;
    baseConfig.optimizeDeps.include = [];
    const envConfig: vite.InlineConfig = {
      plugins: paths.map((path) =>
        wxtPlugins.removeEntrypointMainFunction(wxtConfig, path),
      ),
    };
    const config = vite.mergeConfig(baseConfig, envConfig);
    const server = await vite.createServer(config);
    await server.pluginContainer.buildStart({});
    const node = new ViteNodeServer(
      // @ts-ignore: Some weird type error...
      server,
    );
    installSourcemapsSupport({
      getSourceMap: (source) => node.getSourceMap(source),
    });
    const runner = new ViteNodeRunner({
      root: server.config.root,
      base: server.config.base,
      // when having the server and runner in a different context,
      // you will need to handle the communication between them
      // and pass to this function
      fetchModule(id) {
        return node.fetchModule(id);
      },
      resolveId(id, importer) {
        return node.resolveId(id, importer);
      },
    });
    return { runner, server };
  };

  const requireDefaultExport = (path: string, mod: any) => {
    const relativePath = relative(wxtConfig.root, path);
    if (mod?.default == null) {
      const defineFn = relativePath.includes('.content')
        ? 'defineContentScript'
        : relativePath.includes('background')
          ? 'defineBackground'
          : 'defineUnlistedScript';

      throw Error(
        `${relativePath}: Default export not found, did you forget to call "export default ${defineFn}(...)"?`,
      );
    }
  };

  return {
    name: 'Vite',
    version: vite.version,
    async importEntrypoint(path) {
      const env = createExtensionEnvironment();
      const { runner, server } = await createViteNodeImporter([path]);
      const res = await env.run(() => runner.executeFile(path));
      await server.close();
      requireDefaultExport(path, res);
      return res.default;
    },
    async importEntrypoints(paths) {
      const env = createExtensionEnvironment();
      const { runner, server } = await createViteNodeImporter(paths);
      const res = await env.run(() =>
        Promise.all(
          paths.map(async (path) => {
            const mod = await runner.executeFile(path);
            requireDefaultExport(path, mod);
            return mod.default;
          }),
        ),
      );
      await server.close();
      return res;
    },
    async build(group) {
      let entryConfig;
      if (Array.isArray(group)) entryConfig = getMultiPageConfig(group);
      else if (
        group.type === 'content-script-style' ||
        group.type === 'unlisted-style'
      )
        entryConfig = getCssConfig(group);
      else entryConfig = getLibModeConfig(group);

      const buildConfig = vite.mergeConfig(await getBaseConfig(), entryConfig);
      await hooks.callHook(
        'vite:build:extendConfig',
        toArray(group),
        buildConfig,
      );
      const result = await vite.build(buildConfig);
      const chunks = getBuildOutputChunks(result);
      return {
        entrypoints: group,
        chunks: await moveHtmlFiles(wxtConfig, group, chunks),
      };
    },
    async createServer(info) {
      const serverConfig: vite.InlineConfig = {
        server: {
          host: info.host,
          port: info.port,
          strictPort: true,
          origin: info.origin,
        },
      };
      const baseConfig = await getBaseConfig();
      const finalConfig = vite.mergeConfig(baseConfig, serverConfig);
      await hooks.callHook('vite:devServer:extendConfig', finalConfig);
      const viteServer = await vite.createServer(finalConfig);

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
        on(event, cb) {
          viteServer.httpServer?.on(event, cb);
        },
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

  if (virtualEntrypointType) {
    const moduleId: VirtualModuleId = `virtual:wxt-${virtualEntrypointType}-entrypoint`;
    return `${moduleId}?${entrypoint.inputPath}`;
  }
  return entrypoint.inputPath;
}

/**
 * Ensures the HTML files output by a multipage build are in the correct location. This does two
 * things:
 *
 * 1. Moves the HTML files to their final location at `<outDir>/<entrypoint.name>.html`.
 * 2. Updates the bundle so it summarizes the files correctly in the returned build output.
 *
 * Assets (JS and CSS) are output to the `<outDir>/assets` directory, and don't need to be modified.
 * HTML files access them via absolute URLs, so we don't need to update any import paths in the HTML
 * files either.
 */
async function moveHtmlFiles(
  config: ResolvedConfig,
  group: EntrypointGroup,
  chunks: BuildStepOutput['chunks'],
): Promise<BuildStepOutput['chunks']> {
  if (!Array.isArray(group)) return chunks;

  const entryMap = group.reduce<Record<string, Entrypoint>>((map, entry) => {
    const a = normalizePath(relative(config.root, entry.inputPath));
    map[a] = entry;
    return map;
  }, {});

  const movedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      if (!chunk.fileName.endsWith('.html')) return chunk;

      const entry = entryMap[chunk.fileName];
      const oldBundlePath = chunk.fileName;
      const newBundlePath = getEntrypointBundlePath(
        entry,
        config.outDir,
        extname(chunk.fileName),
      );
      const oldAbsPath = join(config.outDir, oldBundlePath);
      const newAbsPath = join(config.outDir, newBundlePath);
      await fs.ensureDir(dirname(newAbsPath));
      await fs.move(oldAbsPath, newAbsPath, { overwrite: true });

      return {
        ...chunk,
        fileName: newBundlePath,
      };
    }),
  );

  // TODO: Optimize and only delete old path directories
  removeEmptyDirs(config.outDir);

  return movedChunks;
}

/**
 * Recursively remove all directories that are empty/
 */
export async function removeEmptyDirs(dir: string): Promise<void> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await removeEmptyDirs(filePath);
    }
  }

  try {
    await fs.rmdir(dir);
  } catch {
    // noop on failure - this means the directory was not empty.
  }
}
