import { readFile } from 'node:fs/promises';
import { resolve } from 'path';
import type { Plugin } from 'vite';
import { ResolvedConfig } from '../../../../types';
import { normalizePath } from '../../../utils';
import {
  VirtualModuleId,
  virtualModuleNames,
} from '../../../utils/virtual-modules';

/**
 * Resolve all the virtual modules to the `node_modules/wxt/dist/virtual`
 * directory.
 */
export function resolveVirtualModules(config: ResolvedConfig): Plugin[] {
  return virtualModuleNames.map((name) => {
    const virtualId: `${VirtualModuleId}?` = `virtual:wxt-${name}?`;
    const userVirtualId = `virtual:user-${name}`;
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
          const template = await readFile(
            resolve(config.wxtModuleDir, `dist/virtual/${name}.mjs`),
            'utf-8',
          );
          const escapedPath = JSON.stringify(inputPath);
          const code = template
            .replace(`'${userVirtualId}'`, escapedPath)
            .replace(`"${userVirtualId}"`, escapedPath);
          if (code === template) {
            throw Error(
              `Failed to resolve virtual module "${name}": expected template import "${userVirtualId}"`,
            );
          }
          return code;
        },
      },
    };
  });
}
