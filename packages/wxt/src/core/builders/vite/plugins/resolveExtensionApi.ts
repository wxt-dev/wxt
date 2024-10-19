import { ResolvedConfig } from '../../../../types';
import type * as vite from 'vite';

/**
 * Apply the experimental config for which extension API is used. This only
 * effects the extension API included at RUNTIME - during development, types
 * depend on the import.
 *
 * NOTE: this only works if we import `wxt/browser` instead of using the relative path.
 */
export function resolveExtensionApi(config: ResolvedConfig): vite.Plugin {
  return {
    name: 'wxt:resolve-extension-api',
    config() {
      // Only apply the config if we're not using the chrome API
      if (config.extensionApi === 'chrome') return;

      return {
        resolve: {
          alias: [
            {
              find: /^wxt\/browser$/,
              replacement: 'wxt/browser/webextension-polyfill',
            },
          ],
        },
      };
    },
  };
}
