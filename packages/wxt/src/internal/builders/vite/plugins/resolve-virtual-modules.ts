import type { Plugin } from 'vite';
import { ResolvedConfig } from '../../../../types';
import { normalizePath } from '../../../../internal-utils/path-utils';
import { getEntrypointName } from '../../../../internal-utils/entrypoint-utils';
import { virtualModules } from '../../../../internal-utils/virtual-modules';
import { VirtualModuleId, virtualModuleNames } from '../../../virtual-modules';

/**
 * Resolve all the virtual modules to the templates bundled as strings in
 * `internal-utils/virtual-modules.ts`.
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
        handler(id) {
          const inputPath = id.replace(resolvedVirtualId, '');
          const template = virtualModules[name];
          const entrypointName = getEntrypointName(
            config.entrypointsDir,
            inputPath,
          );
          return template
            .replace(`virtual:user-${name}`, inputPath)
            .replace(
              'virtual:wxt-plugins',
              `virtual:wxt-plugins?entrypoint=${encodeURIComponent(entrypointName)}`,
            );
        },
      },
    };
  });
}
