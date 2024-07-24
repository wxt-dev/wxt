import { ResolvedConfig } from '../../../../types';
import type * as vite from 'vite';

/**
 * Apply the experimental config for which extension API is used.
 */
export function resolveExtensionApi(config: ResolvedConfig): vite.Plugin {
  const polyfillVirtualId = 'virtual:wxt-webextension-polyfill-disabled';

  return {
    name: 'wxt:exclude-browser-polyfill',
    config() {
      // Only apply the config if we're disabling the polyfill
      if (config.experimental.extensionApi === 'webextension-polyfill') return;

      return {
        resolve: {
          alias: [
            { find: /^wxt\/browser$/, replacement: 'wxt/browser/chrome' },
            // {
            //   find: 'webextension-polyfill',
            //   replacement: polyfillVirtualId,
            // },
          ],
        },
      };
    },
    // load(id) {
    //   console.log(id);
    // },
    // load(id) {
    //   if (id === polyfillVirtualId) {
    //     // Use chrome instead of the polyfill when disabled.
    //     return 'export default chrome';
    //   }
    // },
  };
}
