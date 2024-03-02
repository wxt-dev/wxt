import { loadConfig } from 'c12';
import {
  InlineConfig,
  ResolvedConfig,
  UserConfig,
  ConfigEnv,
  UserManifestFn,
  UserManifest,
  ExtensionRunnerConfig,
  WxtDevServer,
  WxtResolvedUnimportOptions,
  Logger,
} from '~/types';
import path from 'node:path';
import { createFsCache } from '~/core/utils/cache';
import consola, { LogLevels } from 'consola';
import { createViteBuilder } from '~/core/builders/vite';
import defu from 'defu';
import { NullablyRequired } from '../types';
import { isModuleInstalled } from '../package';
import fs from 'fs-extra';
import { normalizePath } from '../paths';

/**
 * Given an inline config, discover the config file if necessary, merge the results, resolve any
 * relative paths, and apply any defaults.
 *
 * Inline config always has priority over user config. Cli flags are passed as inline config if set.
 * If unset, undefined is passed in, letting this function decide default values.
 */
export async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve',
  server?: WxtDevServer,
): Promise<ResolvedConfig> {
  // Load user config

  let userConfig: UserConfig = {};
  let userConfigMetadata: ResolvedConfig['userConfigMetadata'] | undefined;
  if (inlineConfig.configFile !== false) {
    const { config: loadedConfig, ...metadata } = await loadConfig<UserConfig>({
      configFile: inlineConfig.configFile,
      name: 'wxt',
      cwd: inlineConfig.root ?? process.cwd(),
      rcFile: false,
      jitiOptions: {
        esmResolve: true,
      },
    });
    userConfig = loadedConfig ?? {};
    userConfigMetadata = metadata;
  }

  // Merge it into the inline config

  const mergedConfig = mergeInlineConfig(inlineConfig, userConfig);

  // Apply defaults to make internal config.

  const debug = mergedConfig.debug ?? false;
  const logger = mergedConfig.logger ?? consola;
  if (debug) logger.level = LogLevels.debug;

  const browser = mergedConfig.browser ?? 'chrome';
  const manifestVersion =
    mergedConfig.manifestVersion ??
    (browser === 'firefox' || browser === 'safari' ? 2 : 3);
  const mode =
    mergedConfig.mode ?? (command === 'build' ? 'production' : 'development');
  const env: ConfigEnv = { browser, command, manifestVersion, mode };

  const root = path.resolve(
    inlineConfig.root ?? userConfig.root ?? process.cwd(),
  );
  const wxtDir = path.resolve(root, '.wxt');
  const wxtModuleDir = await resolveWxtModuleDir();
  const srcDir = path.resolve(root, mergedConfig.srcDir ?? root);
  const entrypointsDir = path.resolve(
    srcDir,
    mergedConfig.entrypointsDir ?? 'entrypoints',
  );
  if (await isDirMissing(entrypointsDir)) {
    logMissingDir(logger, 'Entrypoints', entrypointsDir);
  }
  const filterEntrypoints = !!mergedConfig.filterEntrypoints?.length
    ? new Set(mergedConfig.filterEntrypoints)
    : undefined;
  const publicDir = path.resolve(srcDir, mergedConfig.publicDir ?? 'public');
  if (await isDirMissing(publicDir)) {
    logMissingDir(logger, 'Public', publicDir);
  }
  const typesDir = path.resolve(wxtDir, 'types');
  const outBaseDir = path.resolve(root, mergedConfig.outDir ?? '.output');
  const outDir = path.resolve(outBaseDir, `${browser}-mv${manifestVersion}`);
  const reloadCommand = mergedConfig.dev?.reloadCommand ?? 'Alt+R';

  const runnerConfig = await loadConfig<ExtensionRunnerConfig>({
    name: 'web-ext',
    cwd: root,
    globalRc: true,
    rcFile: '.webextrc',
    overrides: inlineConfig.runner,
    defaults: userConfig.runner,
  });
  // Make sure alias are absolute
  const alias = Object.fromEntries(
    Object.entries({
      ...mergedConfig.alias,
      '@': srcDir,
      '~': srcDir,
      '@@': root,
      '~~': root,
    }).map(([key, value]) => [key, path.resolve(root, value)]),
  );

  const analysisOutputFile = path.resolve(
    root,
    mergedConfig.analysis?.outputFile ?? 'stats.html',
  );
  const analysisOutputDir = path.dirname(analysisOutputFile);
  const analysisOutputName = path.parse(analysisOutputFile).name;

  const finalConfig: Omit<ResolvedConfig, 'builder'> = {
    browser,
    command,
    debug,
    entrypointsDir,
    filterEntrypoints,
    env,
    fsCache: createFsCache(wxtDir),
    imports: await getUnimportOptions(wxtDir, logger, mergedConfig),
    logger,
    manifest: await resolveManifestConfig(env, mergedConfig.manifest),
    manifestVersion,
    mode,
    outBaseDir,
    outDir,
    publicDir,
    wxtModuleDir,
    root,
    runnerConfig,
    srcDir,
    typesDir,
    wxtDir,
    zip: resolveInternalZipConfig(root, mergedConfig),
    transformManifest(manifest) {
      userConfig.transformManifest?.(manifest);
      inlineConfig.transformManifest?.(manifest);
    },
    analysis: {
      enabled: mergedConfig.analysis?.enabled ?? false,
      template: mergedConfig.analysis?.template ?? 'treemap',
      outputFile: analysisOutputFile,
      outputDir: analysisOutputDir,
      outputName: analysisOutputName,
      keepArtifacts: mergedConfig.analysis?.keepArtifacts ?? false,
    },
    userConfigMetadata: userConfigMetadata ?? {},
    alias,
    experimental: {
      includeBrowserPolyfill:
        mergedConfig.experimental?.includeBrowserPolyfill ?? true,
    },
    server,
    dev: {
      reloadCommand,
    },
    hooks: mergedConfig.hooks ?? {},
  };

  const builder = await createViteBuilder(
    inlineConfig,
    userConfig,
    finalConfig,
  );

  return {
    ...finalConfig,
    builder,
  };
}

async function resolveManifestConfig(
  env: ConfigEnv,
  manifest: UserManifest | Promise<UserManifest> | UserManifestFn | undefined,
): Promise<UserManifest> {
  return await (typeof manifest === 'function'
    ? manifest(env)
    : manifest ?? {});
}

/**
 * Merge the inline config and user config. Inline config is given priority. Defaults are not applied here.
 */
function mergeInlineConfig(
  inlineConfig: InlineConfig,
  userConfig: UserConfig,
): NullablyRequired<InlineConfig> {
  let imports: InlineConfig['imports'];
  if (inlineConfig.imports === false || userConfig.imports === false) {
    imports = false;
  } else if (userConfig.imports == null && inlineConfig.imports == null) {
    imports = undefined;
  } else {
    imports = defu(inlineConfig.imports ?? {}, userConfig.imports ?? {});
  }
  const manifest: UserManifestFn = async (env) => {
    const user = await resolveManifestConfig(env, userConfig.manifest);
    const inline = await resolveManifestConfig(env, inlineConfig.manifest);
    return defu(inline, user);
  };
  const runner: InlineConfig['runner'] = defu(
    inlineConfig.runner ?? {},
    userConfig.runner ?? {},
  );
  const zip: InlineConfig['zip'] = defu(
    inlineConfig.zip ?? {},
    userConfig.zip ?? {},
  );
  const hooks: InlineConfig['hooks'] = defu(
    inlineConfig.hooks ?? {},
    userConfig.hooks ?? {},
  );

  return {
    root: inlineConfig.root ?? userConfig.root,
    browser: inlineConfig.browser ?? userConfig.browser,
    manifestVersion: inlineConfig.manifestVersion ?? userConfig.manifestVersion,
    configFile: inlineConfig.configFile,
    debug: inlineConfig.debug ?? userConfig.debug,
    entrypointsDir: inlineConfig.entrypointsDir ?? userConfig.entrypointsDir,
    filterEntrypoints:
      inlineConfig.filterEntrypoints ?? userConfig.filterEntrypoints,
    imports,
    logger: inlineConfig.logger ?? userConfig.logger,
    manifest,
    mode: inlineConfig.mode ?? userConfig.mode,
    publicDir: inlineConfig.publicDir ?? userConfig.publicDir,
    runner,
    srcDir: inlineConfig.srcDir ?? userConfig.srcDir,
    outDir: inlineConfig.outDir ?? userConfig.outDir,
    zip,
    analysis: {
      ...userConfig.analysis,
      ...inlineConfig.analysis,
    },
    alias: {
      ...userConfig.alias,
      ...inlineConfig.alias,
    },
    experimental: {
      ...userConfig.experimental,
      ...inlineConfig.experimental,
    },
    vite: undefined,
    transformManifest: undefined,
    dev: {
      ...userConfig.dev,
      ...inlineConfig.dev,
    },
    hooks,
  };
}

function resolveInternalZipConfig(
  root: string,
  mergedConfig: InlineConfig,
): NullablyRequired<ResolvedConfig['zip']> {
  const downloadedPackagesDir = path.resolve(root, '.wxt/local_modules');
  return {
    name: undefined,
    sourcesTemplate: '{{name}}-{{version}}-sources.zip',
    artifactTemplate: '{{name}}-{{version}}-{{browser}}.zip',
    sourcesRoot: root,
    includeSources: [],
    ...mergedConfig.zip,
    excludeSources: [
      '**/node_modules',
      // WXT files
      '**/web-ext.config.ts',
      // Hidden files
      '**/.*',
      // Tests
      '**/__tests__/**',
      '**/*.+(test|spec).?(c|m)+(j|t)s?(x)',
      // From user
      ...(mergedConfig.zip?.excludeSources ?? []),
    ],
    downloadPackages: mergedConfig.zip?.downloadPackages ?? [],
    downloadedPackagesDir,
  };
}

async function getUnimportOptions(
  wxtDir: string,
  logger: Logger,
  config: InlineConfig,
): Promise<WxtResolvedUnimportOptions | false> {
  if (config.imports === false) return false;

  const enabledConfig = config.imports?.eslintrc?.enabled;
  let enabled: boolean;
  switch (enabledConfig) {
    case undefined:
    case 'auto':
      enabled = await isModuleInstalled('eslint');
      break;
    default:
      enabled = enabledConfig;
  }

  const defaultOptions: WxtResolvedUnimportOptions = {
    debugLog: logger.debug,
    imports: [
      { name: 'defineConfig', from: 'wxt' },
      { name: 'fakeBrowser', from: 'wxt/testing' },
    ],
    presets: [
      { package: 'wxt/client' },
      { package: 'wxt/browser' },
      { package: 'wxt/sandbox' },
      { package: 'wxt/storage' },
    ],
    warn: logger.warn,
    dirs: ['components', 'composables', 'hooks', 'utils'],
    eslintrc: {
      enabled,
      filePath: path.resolve(wxtDir, 'eslintrc-auto-import.json'),
      globalsPropValue: true,
    },
  };

  return defu<WxtResolvedUnimportOptions, [WxtResolvedUnimportOptions]>(
    config.imports ?? {},
    defaultOptions,
  );
}

/**
 * Returns the path to `node_modules/wxt`.
 */
async function resolveWxtModuleDir() {
  const requireResolve =
    require?.resolve ??
    (await import('node:module')).default.createRequire(import.meta.url)
      .resolve;
  // require.resolve returns the wxt/dist/index file, not the package's root directory, which we want to return
  return path.resolve(requireResolve('wxt'), '../..');
}

async function isDirMissing(dir: string) {
  return !(await fs.exists(dir));
}

function logMissingDir(logger: Logger, name: string, expected: string) {
  logger.warn(
    `${name} directory not found: ./${normalizePath(
      path.relative(process.cwd(), expected),
    )}`,
  );
}
