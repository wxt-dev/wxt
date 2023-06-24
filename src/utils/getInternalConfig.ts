import { InlineConfig, InternalConfig, UserConfig } from '../types';
import path, { resolve } from 'node:path';
import * as vite from 'vite';
import { consola } from 'consola';
import { importTsFile } from './importTsFile';
import * as plugins from '../vite-plugins';
import { createFsCache } from './createFsCache';

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
  const srcDir =
    config.srcDir == null ? root : path.resolve(root, config.srcDir);
  const entrypointsDir = path.resolve(
    srcDir,
    config.entrypointsDir ?? 'entrypoints',
  );
  const mode =
    config.mode ?? (command === 'build' ? 'production' : 'development');
  const exviteDir = resolve(srcDir, '.exvite');
  const typesDir = resolve(exviteDir, 'types');
  const browser = config.browser ?? 'chromium';
  const manifestVersion =
    config.manifestVersion ?? (browser === 'chromium' ? 3 : 2);
  const outBaseDir = path.resolve(root, '.output');
  const outDir = path.resolve(outBaseDir, `${browser}-mv${manifestVersion}`);
  const logger = config.logger ?? consola;

  const baseConfig: InternalConfig = {
    root,
    srcDir,
    entrypointsDir,
    exviteDir,
    typesDir,
    outDir,
    outBaseDir,
    storeIds: config.storeIds ?? {},
    browser,
    manifestVersion,
    mode,
    command,
    logger,
    vite: config.vite ?? {},
    manifest: config.manifest ?? {},
    fsCache: createFsCache(srcDir),
    imports: config.imports ?? {},
  };

  // Load user config from file
  let userConfig: UserConfig = {
    mode: config.mode,
  };
  if (config.configFile !== false) {
    userConfig = await importTsFile<UserConfig>(
      path.resolve(config.configFile ?? 'exvite.config.ts'),
    );
  }

  // Merge inline and user configs
  const merged = vite.mergeConfig(baseConfig, userConfig) as InternalConfig;

  // Customize the default vite config
  merged.vite.root = root;
  merged.vite.configFile = false;
  merged.vite.logLevel = 'silent';

  merged.vite.build ??= {};
  merged.vite.build.outDir = outDir;
  merged.vite.build.emptyOutDir = false;

  merged.vite.plugins ??= [];
  merged.vite.plugins.push(plugins.download(merged));
  merged.vite.plugins.push(plugins.devHtmlPrerender(merged));
  merged.vite.plugins.push(plugins.unimport(merged));
  merged.vite.plugins.push(plugins.virtualEntrypoin('background'));
  merged.vite.plugins.push(plugins.virtualEntrypoin('content-script'));

  return merged;
}
