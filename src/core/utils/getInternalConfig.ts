import { loadConfig } from 'c12';
import {
  InlineConfig,
  InternalConfig,
  UserConfig,
  ConfigEnv,
  UserManifestFn,
  UserManifest,
  WxtViteConfig,
  ExtensionRunnerConfig,
} from '../types';
import path from 'node:path';
import * as vite from 'vite';
import { createFsCache } from './createFsCache';
import consola, { LogLevels } from 'consola';
import * as plugins from '../vite-plugins';
import { getGlobals } from './globals';

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
  if (inlineConfig.configFile !== false) {
    const loaded = await loadConfig<UserConfig>({
      name: 'wxt',
      cwd: inlineConfig.root ?? process.cwd(),
      rcFile: false,
    });
    userConfig = loaded.config ?? {};
  }

  // Merge it into the inline config

  const mergedConfig = mergeInlineConfig(inlineConfig, userConfig);

  // Apply defaults to make internal config.

  const debug = mergedConfig.debug ?? false;
  const logger = mergedConfig.logger ?? consola;
  if (debug) logger.level = LogLevels.debug;

  const browser = mergedConfig.browser ?? 'chrome';
  const manifestVersion =
    mergedConfig.manifestVersion ?? (browser == 'firefox' ? 2 : 3);
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
  const outBaseDir = path.resolve(root, '.output');
  const outDir = path.resolve(outBaseDir, `${browser}-mv${manifestVersion}`);

  const runnerConfig = await loadConfig<ExtensionRunnerConfig>({
    name: 'web-ext',
    cwd: root,
    globalRc: true,
    rcFile: '.webextrc',
    overrides: mergedConfig.runner,
  });

  const finalConfig: InternalConfig = {
    browser,
    command,
    debug,
    entrypointsDir,
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
    vite: {}, // Real value added after this object is initialized.
    wxtDir,
    zip: resolveInternalZipConfig(root, mergedConfig),
  };

  finalConfig.vite = await resolveInternalViteConfig(
    env,
    mergedConfig,
    finalConfig,
  );

  return finalConfig;
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
): InlineConfig {
  let imports: InlineConfig['imports'];
  if (inlineConfig.imports === false || userConfig.imports === false) {
    imports = false;
  } else if (userConfig.imports == null && inlineConfig.imports == null) {
    imports = undefined;
  } else {
    imports = vite.mergeConfig(
      userConfig.imports ?? {},
      inlineConfig.imports ?? {},
    );
  }
  const manifest: UserManifestFn = async (env) => {
    const user = await resolveManifestConfig(env, userConfig.manifest);
    const inline = await resolveManifestConfig(env, inlineConfig.manifest);
    return vite.mergeConfig(user, inline);
  };
  const viteConfig = async (env: ConfigEnv): Promise<WxtViteConfig> => {
    const user = await resolveViteConfig(env, userConfig.vite);
    const inline = await resolveViteConfig(env, inlineConfig.vite);
    return vite.mergeConfig(user, inline);
  };
  const runner: InlineConfig['runner'] = vite.mergeConfig(
    userConfig.runner ?? {},
    inlineConfig.runner ?? {},
  );
  const zip: InlineConfig['zip'] = vite.mergeConfig(
    userConfig.zip ?? {},
    inlineConfig.zip ?? {},
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
    vite: viteConfig,
    zip,
  };
}

async function resolveViteConfig(
  env: ConfigEnv,
  vite: InlineConfig['vite'],
): Promise<WxtViteConfig> {
  return await (typeof vite === 'function' ? vite(env) : vite ?? {});
}

function resolveInternalZipConfig(
  root: string,
  mergedConfig: InlineConfig,
): InternalConfig['zip'] {
  return {
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

async function resolveInternalViteConfig(
  env: ConfigEnv,
  mergedConfig: InlineConfig,
  finalConfig: InternalConfig,
) {
  const internalVite: vite.InlineConfig = await resolveViteConfig(
    env,
    mergedConfig.vite,
  );
  internalVite.root = finalConfig.root;
  internalVite.configFile = false;
  internalVite.logLevel = 'warn';

  internalVite.build ??= {};
  internalVite.build.outDir = finalConfig.outDir;
  internalVite.build.emptyOutDir = false;

  internalVite.plugins ??= [];
  internalVite.plugins.push(plugins.download(finalConfig));
  internalVite.plugins.push(plugins.devHtmlPrerender(finalConfig));
  internalVite.plugins.push(plugins.unimport(finalConfig));
  internalVite.plugins.push(
    plugins.virtualEntrypoin('background', finalConfig),
  );
  internalVite.plugins.push(
    plugins.virtualEntrypoin('content-script', finalConfig),
  );
  internalVite.plugins.push(plugins.devServerGlobals(finalConfig));
  internalVite.plugins.push(plugins.tsconfigPaths(finalConfig));
  internalVite.plugins.push(plugins.noopBackground());

  internalVite.define ??= {};
  for (const global of getGlobals(finalConfig)) {
    internalVite.define[global.name] = JSON.stringify(global.value);
  }
  return internalVite;
}
