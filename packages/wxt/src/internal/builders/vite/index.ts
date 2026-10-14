import { Hookable } from 'hookable';
import { mkdir, readdir, rename, rmdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import type * as vite from 'vite';
import {
  BuildStepOutput,
  Entrypoint,
  EntrypointGroup,
  ResolvedConfig,
  ServerInfo,
  WxtBuilder,
  WxtBuilderServer,
  WxtDevServer,
  WxtHooks,
} from '../../../types';
import { normalizePath } from '../../../internal-utils/path-utils';
import { toArray } from '../../../internal-utils/array-utils';
import {
  getEntrypointBundlePath,
  isHtmlEntrypoint,
} from '../../../internal-utils/entrypoint-utils';
import { createExtensionEnvironment } from '../../environments';
import { safeVarName } from '../../../internal-utils/string-utils';
import { VirtualEntrypointType, VirtualModuleId } from '../../virtual-modules';
import * as wxtPlugins from './plugins';

interface RollupAssetNameInfo {
  name?: string;
  names?: string[];
}

export class ViteBuilder implements WxtBuilder {
  name = 'Vite';
  version: string;

  constructor(
    private vite: typeof import('vite'),
    private config: ResolvedConfig,
    private hooks: Hookable<WxtHooks>,
    private getWxtDevServer: () => WxtDevServer | undefined,
  ) {
    this.version = vite.version;
  }

  async build(group: EntrypointGroup): Promise<BuildStepOutput> {
    // #region snippet
    let entryConfig: vite.InlineConfig;
    if (Array.isArray(group)) entryConfig = this.getMultiPageConfig(group);
    else if (
      group.type === 'content-script-style' ||
      group.type === 'unlisted-style'
    )
      entryConfig = this.getCssConfig(group);
    else entryConfig = this.getLibModeConfig(group);
    // #endregion snippet

    const buildConfig: vite.InlineConfig = this.vite.mergeConfig(
      await this.getBaseConfig(),
      entryConfig,
    );
    await this.hooks.callHook(
      'vite:build:extendConfig',
      toArray(group),
      buildConfig,
    );

    const result = await this.vite.build(buildConfig);
    const chunks = getBuildOutputChunks(result);
    return {
      entrypoints: group,
      chunks: await moveHtmlFiles(this.config, group, chunks),
    };
  }

  async createServer(info: ServerInfo): Promise<WxtBuilderServer> {
    const serverConfig: vite.InlineConfig = {
      server: {
        host: info.host,
        port: info.port,
        // The port is already resolved to an available one during config
        // resolution, and vite needs to use the port the rest of WXT uses.
        strictPort: true,
        origin: info.origin,
      },
    };
    const baseConfig = await this.getBaseConfig();
    const finalConfig = this.vite.mergeConfig(baseConfig, serverConfig);
    await this.hooks.callHook('vite:devServer:extendConfig', finalConfig);
    const viteServer = await this.vite.createServer(finalConfig);

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
  }

  async importEntrypoint<T>(this: WxtBuilder, path: string): Promise<T> {
    const [module] = await this.importEntrypoints([path]);

    return module as any;
  }

  async importEntrypoints(paths: string[]): Promise<Record<string, unknown>[]> {
    const context = createExtensionEnvironment();
    const environment = await this.createImporterEnvironment(paths);

    try {
      return await context.run(
        async () =>
          await Promise.all(
            paths.map(async (path) => {
              const module = await environment.runner.import(path);
              this.requireDefaultExport(path, module);
              return module.default as any;
            }),
          ),
      );
    } finally {
      await environment.close();
    }
  }

  /**
   * Returns the base vite config shared by all builds based on the inline and
   * user config.
   */
  private async getBaseConfig(options?: {
    excludeAnalysisPlugin?: boolean;
  }): Promise<vite.InlineConfig> {
    const config: vite.InlineConfig = await this.config.vite(this.config.env);

    config.root = this.config.root;
    config.configFile = false;
    config.logLevel = 'warn';
    config.mode = this.config.mode;
    config.envPrefix ??= ['VITE_', 'WXT_'];

    config.build ??= {};
    config.publicDir = this.config.publicDir;
    config.build.copyPublicDir = false;
    config.build.outDir = this.config.outDir;
    config.build.emptyOutDir = false;
    // Disable minification for the dev command
    if (config.build.minify == null && this.config.command === 'serve') {
      config.build.minify = false;
    }
    // Enable inline sourcemaps for the dev command (so content scripts have sourcemaps)
    if (config.build.sourcemap == null && this.config.command === 'serve') {
      config.build.sourcemap = 'inline';
    }

    config.server ??= {};
    config.server.watch = {
      ...this.config.watchOptions,
      ignored: [
        `${this.config.outBaseDir}/**`,
        `${this.config.wxtDir}/**`,
        ...getRunnerProfileWatchIgnores(this.config),
        ...toArray(this.config.watchOptions.ignored ?? []),
      ],
    };

    // TODO: Remove once https://github.com/wxt-dev/wxt/pull/1411 is merged
    config.legacy ??= {};
    config.legacy.skipWebSocketTokenCheck = true;

    // Solves https://github.com/wxt-dev/wxt/issues/353
    if (isRolldownVersion(this.vite.version)) {
      // TODO: Add charset ascii when supported by oxc
    } else {
      config.esbuild ??= {};
      if (config.esbuild) config.esbuild.charset = 'ascii';
    }

    const server = this.getWxtDevServer?.();

    config.plugins ??= [];
    config.plugins.push(
      wxtPlugins.devHtmlPrerender(this.config, server),
      wxtPlugins.resolveVirtualModules(this.config),
      wxtPlugins.devServerGlobals(this.config, server),
      wxtPlugins.tsconfigPaths(this.config),
      wxtPlugins.noopBackground(),
      wxtPlugins.addRuntimeEnvEntries(this.config),
      wxtPlugins.defineImportMeta(),
      wxtPlugins.wxtPluginLoader(this.config),
      wxtPlugins.resolveAppConfig(this.config),
    );
    if (
      // TODO: Should this be migrated to use perEnvironmentState?
      this.config.analysis.enabled &&
      // If included, entrypoint loader will increment the
      // bundleAnalysis's internal build index tracker, which we don't want
      !options?.excludeAnalysisPlugin
    ) {
      config.plugins.push(wxtPlugins.bundleAnalysis(this.config));
    }

    return config;
  }

  /**
   * Return the basic config for building an entrypoint in [lib
   * mode](https://vitejs.dev/guide/build.html#library-mode).
   */
  private getLibModeConfig(entrypoint: Entrypoint): vite.InlineConfig {
    const entry = getRollupEntry(entrypoint);
    const plugins: NonNullable<vite.UserConfig['plugins']> = [
      wxtPlugins.entrypointGroupGlobals(entrypoint),
    ];
    let iifeReturnValueName = safeVarName(entrypoint.name);

    if (
      entrypoint.type === 'content-script-style' ||
      entrypoint.type === 'unlisted-style'
    ) {
      plugins.push(wxtPlugins.cssEntrypoints(entrypoint, this.config));
    }

    if (
      entrypoint.type === 'content-script' ||
      entrypoint.type === 'unlisted-script'
    ) {
      if (typeof entrypoint.options.globalName === 'string') {
        iifeReturnValueName = entrypoint.options.globalName;
      } else if (typeof entrypoint.options.globalName === 'function') {
        iifeReturnValueName = entrypoint.options.globalName(entrypoint);
      }

      if (!entrypoint.options.globalName) {
        plugins.push(wxtPlugins.iifeAnonymous(iifeReturnValueName));
      } else {
        plugins.push(wxtPlugins.iifeFooter(iifeReturnValueName));
      }
    }

    return {
      mode: this.config.mode,
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
              this.config.outDir,
              '.js',
            ),
            // Output content script CSS to `content-scripts/`, but all other scripts are written to
            // `assets/`.
            assetFileNames: (assetInfo) => {
              if (
                entrypoint.type === 'content-script' &&
                getRollupAssetNames(assetInfo).some((name) =>
                  name.endsWith('css'),
                )
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
        'process.env.NODE_ENV': JSON.stringify(this.config.mode),
      },
    } satisfies vite.UserConfig;
  }

  /**
   * Return the basic config for building multiple entrypoints in [multi-page
   * mode](https://vitejs.dev/guide/build.html#multi-page-app).
   */
  private getMultiPageConfig(entrypoints: Entrypoint[]): vite.InlineConfig {
    const htmlEntrypoints = new Set(
      entrypoints.filter(isHtmlEntrypoint).map((e) => e.name),
    );
    return {
      mode: this.config.mode,
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
  }

  private getCssConfig(entrypoint: Entrypoint): vite.InlineConfig {
    return {
      mode: this.config.mode,
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
  }

  private async createImporterEnvironment(
    paths: string[],
  ): Promise<vite.RunnableDevEnvironment> {
    const baseConfig = await this.getBaseConfig({
      excludeAnalysisPlugin: true,
    });
    // Disable dep optimization, as recommended by vite-node's README
    baseConfig.optimizeDeps ??= {};
    baseConfig.optimizeDeps.noDiscovery = true;
    baseConfig.optimizeDeps.include = [];
    const envConfig: vite.InlineConfig = {
      plugins: paths.map((path) =>
        wxtPlugins.removeEntrypointMainFunction(this.config, path),
      ),
    };
    const importerConfig = this.vite.mergeConfig(baseConfig, envConfig);

    const config = await this.vite.resolveConfig(
      this.vite.mergeConfig(importerConfig || {}, {
        configFile: false,
        envDir: false,
        cacheDir: process.cwd(),
        environments: {
          inline: {
            consumer: 'server',
            dev: {
              moduleRunnerTransform: true,
            },
            resolve: {
              external: true,
              mainFields: [],
              conditions: ['node'],
            },
          },
        },
      } satisfies vite.InlineConfig),
      'serve',
    );

    const environment = this.vite.createRunnableDevEnvironment(
      'inline',
      config,
      {
        runnerOptions: {
          hmr: {
            logger: false,
          },
        },
        hot: false,
      },
    );
    await environment.init();

    return environment;
  }

  private requireDefaultExport(
    path: string,
    mod: any,
  ): asserts mod is { default: unknown } {
    const relativePath = relative(this.config.root, path);
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
  }
}

export function getRunnerProfileWatchIgnores(
  wxtConfig: ResolvedConfig,
): string[] {
  const root = normalizePath(wxtConfig.root);
  const chromiumArgProfiles = extractPathArgs(
    wxtConfig.webExt.config?.chromiumArgs,
    '--user-data-dir',
  );
  const firefoxArgProfiles = extractPathArgs(
    wxtConfig.webExt.config?.firefoxArgs,
    '-profile',
  );
  const profiles = [
    wxtConfig.webExt.config?.chromiumProfile,
    wxtConfig.webExt.config?.firefoxProfile,
    ...chromiumArgProfiles,
    ...firefoxArgProfiles,
  ].filter((profile): profile is string => typeof profile === 'string');

  return Array.from(
    new Set(
      profiles
        .map((profile) => normalizePath(resolve(wxtConfig.root, profile)))
        // Avoid accidentally disabling all file watching.
        .filter((profilePath) => profilePath !== root)
        .map((profilePath) => `${profilePath}/**`),
    ),
  );
}

function extractPathArgs(args: string[] | undefined, flag: string): string[] {
  if (!args?.length) return [];

  const paths: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith(`${flag}=`)) {
      const value = arg.slice(flag.length + 1).trim();
      if (value) paths.push(value);
      continue;
    }

    if (arg === flag) {
      const nextValue = args[i + 1]?.trim();
      if (nextValue) paths.push(nextValue);
      i += 1;
    }
  }

  return paths;
}

function getRollupAssetNames(assetInfo: RollupAssetNameInfo): string[] {
  if (Array.isArray(assetInfo.names)) return assetInfo.names;
  return assetInfo.name ? [assetInfo.name] : [];
}

function getBuildOutputChunks(
  result: Awaited<ReturnType<typeof vite.build>>,
): BuildStepOutput['chunks'] {
  if ('on' in result) throw Error('wxt does not support vite watch mode.');
  if (Array.isArray(result)) return result.flatMap(({ output }) => output);
  return result.output;
}

/**
 * Returns the input module ID (virtual or real file) for an entrypoint. The
 * returned string should be passed as an input to rollup.
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
 * Ensures the HTML files output by a multi-page build are in the correct
 * location. This does two things:
 *
 * 1. Moves the HTML files to their final location at
 *    `<outDir>/<entrypoint.name>.html`.
 * 2. Updates the bundle so it summarizes the files correctly in the returned build
 *    output.
 *
 * Assets (JS and CSS) are output to the `<outDir>/assets` directory, and don't
 * need to be modified. HTML files access them via absolute URLs, so we don't
 * need to update any import paths in the HTML files either.
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
      await mkdir(dirname(newAbsPath), { recursive: true });
      await rename(oldAbsPath, newAbsPath);

      return {
        ...chunk,
        fileName: newBundlePath,
      };
    }),
  );

  // TODO: Optimize and only delete old path directories
  await removeEmptyDirs(config.outDir);

  return movedChunks;
}

/** Recursively remove all directories that are empty/ */
export async function removeEmptyDirs(dir: string): Promise<void> {
  const files = await readdir(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    let stats;
    try {
      stats = await stat(filePath);
    } catch (err: any) {
      // Ignore files that were moved between readdir and stat due to race
      // conditions. For more details, see:
      // https://github.com/wxt-dev/wxt/issues/2533
      if (err?.code === 'ENOENT') continue;
      throw err;
    }
    if (stats.isDirectory()) {
      await removeEmptyDirs(filePath);
    }
  }

  try {
    await rmdir(dir);
  } catch {
    // noop on failure - this means the directory was not empty.
  }
}

function isRolldownVersion(version: string): boolean {
  return Number(version.split('.')[0]) >= 8;
}
