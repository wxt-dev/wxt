import {
  ConfigEnv,
  ExtensionRunnerConfig,
  InlineConfig,
  InternalConfig,
  UserConfig,
  UserManifest,
  UserManifestFn,
} from '../types';
import path, { resolve } from 'node:path';
import * as vite from 'vite';
import { consola } from 'consola';
import * as plugins from '../vite-plugins';
import { createFsCache } from './createFsCache';
import { getGlobals } from './globals';
import { loadConfig } from 'c12';

/**
 * Given an inline config, discover the config file if necessary, merge the results, resolve any
 * relative paths, and apply any defaults.
 */
export async function getInternalConfig(
  config: InlineConfig,
  command: 'build' | 'serve',
): Promise<InternalConfig> {
  // Apply defaults to a base config
  const root = config.root ? path.resolve(config.root) : process.cwd();
  const mode =
    config.mode ?? (command === 'build' ? 'production' : 'development');
  const browser = config.browser ?? 'chrome';
  const manifestVersion =
    config.manifestVersion ?? (browser == 'firefox' ? 2 : 3);
  const outBaseDir = path.resolve(root, '.output');
  const outDir = path.resolve(outBaseDir, `${browser}-mv${manifestVersion}`);
  const logger = config.logger ?? consola;

  const baseConfig: InternalConfigNoUserDirs = {
    root,
    outDir,
    outBaseDir,
    storeIds: config.storeIds ?? {},
    browser,
    manifestVersion,
    mode,
    command,
    logger,
    vite: config.vite ?? {},
    imports: config.imports ?? {},
    runnerConfig: await loadConfig<ExtensionRunnerConfig>({
      name: 'web-ext',
      cwd: root,
      globalRc: true,
      rcFile: '.webextrc',
      overrides: config.runner,
    }),
  };

  // Load user config from file
  let userConfig: UserConfig = {
    mode,
  };
  if (config.configFile !== false) {
    const loaded = await loadConfig<UserConfig>({
      name: 'wxt',
      cwd: root,
      rcFile: false,
    });
    userConfig = loaded.config ?? {};
  }

  // Merge inline and user configs
  const merged = vite.mergeConfig(
    baseConfig,
    userConfig,
  ) as InternalConfigNoUserDirs;

  // Apply user config and create final config
  const srcDir = userConfig.srcDir ? resolve(root, userConfig.srcDir) : root;
  const entrypointsDir = resolve(
    srcDir,
    userConfig.entrypointsDir ?? 'entrypoints',
  );
  const publicDir = resolve(root, userConfig.publicDir ?? 'public');
  const wxtDir = resolve(srcDir, '.wxt');
  const typesDir = resolve(wxtDir, 'types');

  // Merge manifest sources
  const env: ConfigEnv = { mode, browser, manifestVersion, command };
  const userManifest = await resolveManifestConfig(env, userConfig.manifest);
  const inlineManifest = await resolveManifestConfig(env, config.manifest);
  const manifest = vite.mergeConfig(userManifest, inlineManifest);

  const finalConfig: InternalConfig = {
    ...merged,
    srcDir,
    entrypointsDir,
    publicDir,
    wxtDir: wxtDir,
    typesDir,
    fsCache: createFsCache(wxtDir),
    manifest,
    zip: {
      sourcesTemplate: '{{name}}-{{version}}-sources.zip',
      artifactTemplate: '{{name}}-{{version}}-{{browser}}.zip',
      sourcesRoot: root,
      ...userConfig.zip,
      ...config.zip,
      ignoredSources: [
        '**/node_modules',
        // WXT files
        '**/web-ext.config.ts',
        // Hidden files
        '**/.*',
        // Tests
        '**/__tests__/**',
        '**/*.+(test|spec).?(c|m)+(j|t)s?(x)',
        // User config
        ...(userConfig.zip?.ignoredSources ?? []),
        ...(config.zip?.ignoredSources ?? []),
      ],
    },
  };

  // Customize the default vite config
  finalConfig.vite.root = root;
  finalConfig.vite.configFile = false;
  finalConfig.vite.logLevel = 'warn';

  finalConfig.vite.build ??= {};
  finalConfig.vite.build.outDir = outDir;
  finalConfig.vite.build.emptyOutDir = false;

  finalConfig.vite.plugins ??= [];
  finalConfig.vite.plugins.push(plugins.download(finalConfig));
  finalConfig.vite.plugins.push(plugins.devHtmlPrerender(finalConfig));
  finalConfig.vite.plugins.push(plugins.unimport(finalConfig));
  finalConfig.vite.plugins.push(
    plugins.virtualEntrypoin('background', finalConfig),
  );
  finalConfig.vite.plugins.push(
    plugins.virtualEntrypoin('content-script', finalConfig),
  );
  finalConfig.vite.plugins.push(plugins.devServerGlobals(finalConfig));
  finalConfig.vite.plugins.push(plugins.tsconfigPaths(finalConfig));
  finalConfig.vite.plugins.push(plugins.noopBackground());

  finalConfig.vite.define ??= {};
  getGlobals(finalConfig).forEach((global) => {
    finalConfig.vite.define![global.name] = JSON.stringify(global.value);
  });

  return finalConfig;
}

/**
 * Helper type for defining a base config, since user-configurable directories must be set after
 * reading in the user config.
 */
type InternalConfigNoUserDirs = Omit<
  InternalConfig,
  | 'srcDir'
  | 'publicDir'
  | 'entrypointsDir'
  | 'wxtDir'
  | 'typesDir'
  | 'fsCache'
  | 'manifest'
  | 'zip'
>;

async function resolveManifestConfig(
  env: ConfigEnv,
  manifest: UserManifest | Promise<UserManifest> | UserManifestFn | undefined,
): Promise<UserManifest> {
  return await (typeof manifest === 'function'
    ? manifest(env)
    : manifest ?? {});
}
