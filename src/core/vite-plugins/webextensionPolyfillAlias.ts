import path from 'node:path';
import * as vite from 'vite';

/**
 * Creates an alias to redirect "webextension-polyfill" imports to WXT's `fakeBrowser`.
 *
 * This should only be used during tests.
 */
export function webextensionPolyfillAlias(): vite.PluginOption {
  return {
    name: 'wxt:webextension-polyfill-test-alias',
    config() {
      return {
        resolve: {
          alias: {
            'webextension-polyfill': path.resolve(
              'node_modules/wxt/dist/virtual-modules/fake-browser',
            ),
          },
        },
      };
    },
  };
}
