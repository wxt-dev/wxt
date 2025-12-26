import { pathExists } from 'fs-extra';
import { resolve } from 'node:path';
import type * as vite from 'vite';
import { ResolvedConfig } from '../../../../types';

/**
 * When importing `virtual:app-config`, resolve it to the `app.config.ts` file in the project.
 */
export function resolveAppConfig(config: ResolvedConfig): vite.Plugin {
  const VIRTUAL_MODULE_ID = 'virtual:app-config';
  const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
  const appConfigFile = resolve(config.srcDir, 'app.config.ts');

  return {
    name: 'wxt:resolve-app-config',
    config() {
      return {
        optimizeDeps: {
          // Prevent ESBuild from attempting to resolve the virtual module
          // while optimizing WXT.
          exclude: [VIRTUAL_MODULE_ID],
        },
      };
    },
    async resolveId(id) {
      if (id !== VIRTUAL_MODULE_ID) return;

      return (await pathExists(appConfigFile))
        ? appConfigFile
        : RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) return `export default {}`;
    },
  };
}
