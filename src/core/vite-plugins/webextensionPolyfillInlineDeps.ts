import * as vite from 'vite';

/**
 * Add all deps that import `webextension-polyfill` to `test.server.deps.inline`.
 *
 * TODO: Auto-detect non-wxt dependencies via `npm list`.
 */
export function webextensionPolyfillInlineDeps(): vite.PluginOption {
  return {
    name: 'wxt:testing-inline-deps',
    config() {
      const wxtModules = ['wxt/browser', 'wxt/client'];
      return {
        test: {
          server: {
            deps: {
              inline: [...wxtModules],
            },
          },
        },
      };
    },
  };
}
