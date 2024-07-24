import path from 'node:path';
import type * as vite from 'vite';
import { ResolvedConfig } from '../../../../types';

/**
 * Mock `webextension-polyfill`, `wxt/browser`, and `wxt/browser/*` by inlining
 * all dependencies that import them and adding a custom alias so that Vite
 * resolves to a mocked version of the module.
 *
 * TODO: Detect non-wxt dependencies (like `@webext-core/*`) that import `webextension-polyfill` via
 * `npm list` and inline them automatically.
 */
export function extensionApiMock(config: ResolvedConfig): vite.PluginOption {
  return {
    name: 'wxt:extension-api-mock',
    config() {
      const replacement = path.resolve(
        config.wxtModuleDir,
        'dist/virtual/mock-browser',
      );
      return {
        resolve: {
          alias: [
            { find: 'webextension-polyfill', replacement },
            // wxt/browser, wxt/browser/...
            { find: /^wxt\/browser.*/, replacement },
          ],
        },
        ssr: {
          // Inline all WXT modules so vite processes them so the aliases can
          // be resolved
          noExternal: ['wxt'],
        },
      };
    },
  };
}
