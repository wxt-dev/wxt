import type * as vite from 'vite';
import { EntrypointGroup } from '../../../../types';
import { getEntrypointGlobals } from '../../../utils/globals';

/**
 * Define a set of global variables specific to an entrypoint.
 */
export function entrypointGroupGlobals(
  entrypointGroup: EntrypointGroup,
): vite.PluginOption {
  return {
    name: 'wxt:entrypoint-group-globals',
    config() {
      const define: vite.InlineConfig['define'] = {};
      let name = Array.isArray(entrypointGroup) ? 'html' : entrypointGroup.name;
      for (const global of getEntrypointGlobals(name)) {
        define[`import.meta.env.${global.name}`] = JSON.stringify(global.value);
      }
      return {
        define,
      };
    },
  };
}
