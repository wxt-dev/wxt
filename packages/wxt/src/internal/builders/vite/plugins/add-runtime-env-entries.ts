import type * as vite from 'vite';
import { ResolvedConfig } from '../../../../types';
import { getRuntimeEnvEntries } from '../../../runtime-env-entries';

export function addRuntimeEnvEntries(
  config: ResolvedConfig,
): vite.PluginOption {
  return {
    name: 'wxt:add-runtime-env-entries',
    config() {
      const define: vite.InlineConfig['define'] = {};
      for (const global of getRuntimeEnvEntries(config)) {
        define[`import.meta.env.${global.name}`] = JSON.stringify(global.value);
      }
      return {
        define,
      };
    },
  };
}
