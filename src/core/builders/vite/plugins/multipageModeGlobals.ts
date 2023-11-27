import * as vite from 'vite';
import { getEntrypointGlobals } from '~/core/utils/globals';

/**
 * Define a set of global variables for multi-page mode builds.
 */
export function multipageModeGlobals(): vite.PluginOption {
  return {
    name: 'wxt:multi-page-mode-globals',
    config() {
      const define: vite.InlineConfig['define'] = {};
      for (const global of getEntrypointGlobals('html')) {
        define[global.name] = JSON.stringify(global.value);
      }
      return {
        define,
      };
    },
  };
}
