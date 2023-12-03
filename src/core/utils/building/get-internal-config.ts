import { loadConfig } from 'c12';
import {
  InlineConfig,
  InternalConfig,
  UserConfig,
  ConfigEnv,
  UserManifestFn,
  UserManifest,
  ExtensionRunnerConfig,
} from '~/types';
import path from 'node:path';
import * as vite from 'vite';
import { createFsCache } from '~/core/utils/cache';
import consola, { LogLevels } from 'consola';
import { craeteViteBuilder } from '~/core/builders/vite';
import defu from 'defu';
import { NullablyRequired } from '../types';

/**
 * Given an inline config, discover the config file if necessary, merge the results, resolve any
 * relative paths, and apply any defaults.
 *
 * Inline config always has priority over user config. Cli flags are passed as inline config if set.
 * If unset, undefined is passed in, letting this function decide default values.
 */
export async function getInternalConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve',
): Promise<InternalConfig> {
  // Load user config

  let userConfig: UserConfig = {};
  let userConfigMetadata: InternalConfig['userConfigMetadata'] | undefined;
  if (inlineConfig.configFile !== false) {
    const { config: loadedConfig, ...metadata } = await loadConfig<UserConfig>({
      name: 'wxt',
      cwd: inlineConfig.root ?? process.cwd(),
      rcFile: false,
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
  const srcDir = path.resolve(root, mergedConfig.srcDir ?? root);
  const entrypointsDir = path.resolve(
    srcDir,
    mergedConfig.entrypointsDir ?? 'entrypoints',
  );
  const publicDir = path.resolve(srcDir, mergedConfig.publicDir ?? 'public');
  const typesDir = path.resolve(wxtDir, 'types');
  const outBaseDir = path.resolve(root, mergedConfig.outDir ?? '.output');
  const outDir = path.resolve(outBaseDir, `${browser}-mv${manifestVersion}`);

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

  const finalConfig: Omit<InternalConfig, 'builder'> = {
    browser,
    command,
    debug,
    entrypointsDir,
    env,
    fsCache: createFsCache(wxtDir),
    imports: mergedConfig.imports ?? {},
    logger,
    manifest: await resolveManifestConfig(env, mergedConfig.manifest),
    manifestVersion,
    mode,
    outBaseDir,
    outDir,
    publicDir,
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
    },
    userConfigMetadata: userConfigMetadata ?? {},
    alias,
    experimental: {
      includeBrowserPolyfill:
        mergedConfig.experimental?.includeBrowserPolyfill ?? true,
    },
  };

  const builder = await craeteViteBuilder(
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
    // TODO
    imports = vite.mergeConfig(
      userConfig.imports ?? {},
      inlineConfig.imports ?? {},
    );
  }
  const manifest: UserManifestFn = async (env) => {
    const user = await resolveManifestConfig(env, userConfig.manifest);
    const inline = await resolveManifestConfig(env, inlineConfig.manifest);
    // TODO
    return vite.mergeConfig(user, inline);
  };
  const runner: InlineConfig['runner'] = defu(
    inlineConfig.runner ?? {},
    userConfig.runner ?? {},
  );
  const zip: InlineConfig['zip'] = defu(
    inlineConfig.zip ?? {},
    userConfig.zip ?? {},
  );

  return {
    root: inlineConfig.root ?? userConfig.root,
    browser: inlineConfig.browser ?? userConfig.browser,
    manifestVersion: inlineConfig.manifestVersion ?? userConfig.manifestVersion,
    configFile: inlineConfig.configFile,
    debug: inlineConfig.debug ?? userConfig.debug,
    entrypointsDir: inlineConfig.entrypointsDir ?? userConfig.entrypointsDir,
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
      enabled: inlineConfig.analysis?.enabled ?? userConfig.analysis?.enabled,
      template:
        inlineConfig.analysis?.template ?? userConfig.analysis?.template,
    },
    alias: {
      ...userConfig.alias,
      ...inlineConfig.alias,
    },
    experimental: {
      ...userConfig.experimental,
      ...inlineConfig.experimental,
    },
    transformManifest: undefined,
  };
}

function resolveInternalZipConfig(
  root: string,
  mergedConfig: InlineConfig,
): NullablyRequired<InternalConfig['zip']> {
  return {
    name: undefined,
    sourcesTemplate: '{{name}}-{{version}}-sources.zip',
    artifactTemplate: '{{name}}-{{version}}-{{browser}}.zip',
    sourcesRoot: root,
    ...mergedConfig.zip,
    ignoredSources: [
      '**/node_modules',
      // WXT files
      '**/web-ext.config.ts',
      // Hidden files
      '**/.*',
      // Tests
      '**/__tests__/**',
      '**/*.+(test|spec).?(c|m)+(j|t)s?(x)',
      // From user
      ...(mergedConfig.zip?.ignoredSources ?? []),
    ],
  };
}
