import { InlineConfig, InternalConfig, UserConfig } from '../types';
import path from 'node:path';
import * as vite from 'vite';
import Unimport, { UnimportPluginOptions } from 'unimport/unplugin';
import { consola } from 'consola';
import fs from 'fs-extra';

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
  const mode =
    config.mode ?? (command === 'build' ? 'production' : 'development');

  const baseConfig: InternalConfig = {
    srcDir,
    storeIds: config.storeIds ?? {},
    browser: config.browser ?? 'chromium',
    mode,
    logger: config.logger ?? consola,
    vite: config.vite,
  };

  // Load user config from file
  let userConfig: UserConfig = {
    mode: config.mode,
  };
  if (config.configFile !== false) {
    const loadedConfig = await vite.loadConfigFromFile(
      { command, mode },
      config.configFile ?? 'exvite.config.ts',
    );
    userConfig = loadedConfig?.config as any;
  }

  // Merge inline and user configs
  const merged = vite.mergeConfig(baseConfig, userConfig) as InternalConfig;

  // Customize the default vite config
  merged.vite ??= {};
  merged.vite.root = root;
  merged.vite.configFile = false;
  merged.vite.plugins ??= [];

  const defaultOptions: UnimportPluginOptions = {
    include: srcDir,
    exclude: [],
    addons: [],
    debugLog: () => {},
    dts: path.resolve(root, '.exvite/types/imports.d.ts'),
    imports: [{ name: '*', as: 'browser', from: 'webextension-polyfill' }],
    presets: [],
    virtualImports: [],
    warn: () => {},
    dirs: ['components', 'composables', 'hooks', 'utils'],
  };
  const unimportConfig = vite.mergeConfig(
    defaultOptions,
    userConfig.imports ?? {},
  ) as UnimportPluginOptions;
  const unimport: typeof Unimport.vite =
    // @ts-expect-error: esm availabe within the default object?
    Unimport.vite ?? Unimport.default?.vite;
  merged.vite.plugins.push(unimport(unimportConfig));

  return merged;
}
