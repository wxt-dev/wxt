import { Plugin } from 'vite';
import { ResolvedConfig } from '../../../../types';
import { normalizePath } from '../../../utils/paths';
import {
  VirtualModuleId,
  virtualModuleNames,
} from '../../../utils/virtual-modules';
import { resolve } from 'path';
import fs from 'fs-extra';

/**
 * Resolve all the virtual modules to the `node_modules/wxt/dist/virtual` directory.
 */
export function resolveVirtualModules(config: ResolvedConfig): Plugin[] {
  return virtualModuleNames.map((name) => {
    const virtualId: `${VirtualModuleId}?` = `virtual:wxt-${name}?`;
    const resolvedVirtualId = '\0' + virtualId;

    return {
      name: `wxt:resolve-virtual-${name}`,
      resolveId: {
        filter: {
          id: new RegExp(virtualId),
        },
        handler(id) {
          const inputPath = normalizePath(
            id.substring(id.indexOf(virtualId) + virtualId.length),
          );
          return resolvedVirtualId + inputPath;
        },
      },
      load: {
        filter: {
          id: new RegExp(`^${resolvedVirtualId}`),
        },
        async handler(id) {
          const inputPath = id.replace(resolvedVirtualId, '');
          const template = await fs.readFile(
            resolve(config.wxtModuleDir, `dist/virtual/${name}.mjs`),
            'utf-8',
          );
          return template.replace(`virtual:user-${name}`, inputPath);
        },
      },
    };
  });
}
