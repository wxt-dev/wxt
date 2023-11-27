import * as vite from 'vite';
import { Entrypoint } from '~/types';
import { getEntrypointGlobals } from '~/core/utils/globals';

/**
 * Define a set of global variables specific to an entrypoint.
 */
export function libModeGlobals(entrypoint: Entrypoint): vite.PluginOption {
  return {
    name: 'wxt:lib-mode-globals',
    config() {
      const define: vite.InlineConfig['define'] = {};
      for (const global of getEntrypointGlobals(entrypoint.name)) {
        define[global.name] = JSON.stringify(global.value);
      }
      return {
        define,
      };
    },
  };
}
