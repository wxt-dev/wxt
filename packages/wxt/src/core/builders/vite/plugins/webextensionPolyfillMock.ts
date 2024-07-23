import path from 'node:path';
import type * as vite from 'vite';
import { ResolvedConfig } from '../../../../types';

/**
 * Mock `webextension-polyfill` by inlining all dependencies that import it and adding a custom
 * alias so that Vite resolves to a mocked version of the module.
 *
 * There are two ways to mark a module as inline:
 * 1. Use partial file paths ("wxt/dist/browser.js") in the `test.server.deps.inline` option.
 * 2. Use module names ("wxt" or "@webext-core/messaging") in the `ssr.noExternalize` option.
 *
 * This plugin uses the second approach since it's a little more intuative to understand.
 *
 * TODO: Detect non-wxt dependencies (like `@webext-core/*`) that import `webextension-polyfill` via
 * `npm list` and inline them automatically.
 */
export function webextensionPolyfillMock(
  config: ResolvedConfig,
): vite.PluginOption {
  return {
    name: 'wxt:testing-inline-deps',
    config() {
      return {
        resolve: {
          alias: {
            // Alias to use a mocked version of the polyfill
            'webextension-polyfill': path.resolve(
              config.wxtModuleDir,
              'dist/virtual/mock-browser',
            ),
          },
        },
        ssr: {
          // Inline all WXT modules
          noExternal: ['wxt'],
        },
      };
    },
  };
}
