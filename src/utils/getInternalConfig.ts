import { InlineConfig, InternalConfig, UserConfig } from '../types';
import path from 'node:path';
import * as vite from 'vite';
import { consola } from 'consola';
import { importTsFile } from './importTsFile';
import * as plugins from '../vite-plugins';

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
  const browser = config.browser ?? 'chromium';
  const manifestVersion =
    config.manifestVersion ?? (browser === 'chromium' ? 3 : 2);

  const baseConfig: InternalConfig = {
    srcDir,
    entrypointsDir,
    storeIds: config.storeIds ?? {},
    browser,
    manifestVersion,
    mode,
    command,
    outDir: '.output',
    logger: config.logger ?? consola,
    vite: config.vite,
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
  merged.vite ??= {};
  merged.vite.root = root;
  merged.vite.configFile = false;
  merged.vite.plugins ??= [];

  merged.vite.plugins.push(plugins.unimport(root, srcDir, userConfig.imports));
  merged.vite.plugins.push(plugins.download());

  return merged;
}
