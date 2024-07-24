import { exists } from 'fs-extra';
import { resolve } from 'node:path';
import type * as vite from 'vite';
import { ResolvedConfig } from '../../../../types';

/**
 * When importing `virtual:app-config`, resolve it to the `app.config.ts` file in the project.
 */
export function resolveAppConfig(config: ResolvedConfig): vite.Plugin {
  const virtualModuleId = 'virtual:app-config';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  const appConfigFile = resolve(config.srcDir, 'app.config.ts');

  return {
    name: 'wxt:resolve-app-config',
    config() {
      return {
        optimizeDeps: {
          // Prevent ESBuild from attempting to resolve the virtual module
          // while optimizing WXT.
          exclude: [virtualModuleId],
        },
      };
    },
    async resolveId(id) {
      if (id !== virtualModuleId) return;

      return (await exists(appConfigFile))
        ? appConfigFile
        : resolvedVirtualModuleId;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) return `export default {}`;
    },
  };
}
