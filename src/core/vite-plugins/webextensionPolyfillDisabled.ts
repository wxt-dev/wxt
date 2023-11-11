import { InternalConfig } from '~/types';
import * as vite from 'vite';

/**
 * Apply the experimental config for disabling the polyfill.
 */
export function webextensionPolyfillDisabled(
  config: InternalConfig,
): vite.Plugin {
  const virtualId = 'virtual:wxt-webextension-polyfill-disabled';

  return {
    name: 'wxt:webextension-polyfill-enabled',
    config() {
      if (config.experimental.webextensionPolyfill) return;

      return {
        resolve: {
          alias: {
            'webextension-polyfill': virtualId,
          },
        },
      };
    },
    load(id, options) {
      if (id === virtualId) {
        // Use chrome instead of the polyfill when disabled.
        return 'export default chrome';
      }
    },
  };
}
