import { UnimportOptions } from 'unimport';
import { InternalConfig } from '../types';
import { mergeConfig } from 'vite';

export function getUnimportOptions(
  config: InternalConfig,
): Partial<UnimportOptions | false> {
  if (config.imports === false) return false;

  const defaultOptions: Partial<UnimportOptions> = {
    debugLog: config.logger.debug,
    imports: [{ name: 'defineConfig', from: 'wxt' }],
    presets: [
      { package: 'wxt/client' },
      { package: 'wxt/browser' },
      { package: 'wxt/sandbox' },
    ],
    warn: config.logger.warn,
    dirs: ['components', 'composables', 'hooks', 'utils'],
  };

  return mergeConfig(
    defaultOptions,
    config.imports,
  ) as Partial<UnimportOptions>;
}
