import { ResolvedConfig } from '~/types';
import type * as vite from 'vite';

/**
 * Apply the experimental config for which extension API is used.
 */
export function resolveExtensionApi(config: ResolvedConfig): vite.Plugin {
  return {
    name: 'wxt:exclude-browser-polyfill',
    config() {
      // Only apply the config if we're disabling the polyfill
      if (config.experimental.extensionApi === 'webextension-polyfill') return;

      return {
        resolve: {
          alias: {
            'wxt/browser': 'wxt/browser/chrome',
          },
        },
      };
    },
  };
}
