import type * as vite from 'vite';
import { EntrypointGroup } from '../../../../types';
import { getEntrypointRuntimeEnvEntries } from '../../../runtime-env-entries';

/** Define a set of global variables specific to an entrypoint. */
export function entrypointGroupGlobals(
  entrypointGroup: EntrypointGroup,
): vite.PluginOption {
  return {
    name: 'wxt:add-entrypoint-group-runtime-env-entries',
    config() {
      const define: vite.InlineConfig['define'] = {};
      let name = Array.isArray(entrypointGroup) ? 'html' : entrypointGroup.name;
      for (const global of getEntrypointRuntimeEnvEntries(name)) {
        define[`import.meta.env.${global.name}`] = JSON.stringify(global.value);
      }
      return {
        define,
      };
    },
  };
}
