import { UnimportOptions } from 'unimport';
import { InternalConfig } from '../types';
import { mergeConfig } from 'vite';

export function getUnimportOptions(
  config: InternalConfig,
): Partial<UnimportOptions> {
  const defaultOptions: Partial<UnimportOptions> = {
    debugLog: config.logger.debug,
    imports: [
      { name: '*', as: 'browser', from: 'webextension-polyfill' },
      { name: 'defineConfig', from: 'wxt' },
    ],
    presets: [{ package: 'wxt/client' }],
    warn: config.logger.warn,
    dirs: ['./components/*', './composables/*', './hooks/*', './utils/*'],
  };

  return mergeConfig(
    defaultOptions,
    config.imports,
  ) as Partial<UnimportOptions>;
}
