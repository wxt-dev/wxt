import type { Plugin } from 'vite';
import { ResolvedConfig } from '../../../../types';
import { normalizePath } from '../../../utils';
import {
  VirtualModuleId,
  virtualModuleNames,
} from '../../../utils/virtual-modules';
import fs from 'fs-extra';
import { resolve } from 'path';

/**
 * Resolve all the virtual modules to the `node_modules/wxt/dist/virtual` directory.
 */
export function resolveVirtualModules(config: ResolvedConfig): Plugin[] {
  return virtualModuleNames.map((name) => {
    const VIRTUAL_ID: `${VirtualModuleId}?` = `virtual:wxt-${name}?`;
    const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

    return {
      name: `wxt:resolve-virtual-${name}`,
      resolveId(id) {
        // Id doesn't start with prefix, it looks like this:
        // /path/to/project/virtual:wxt-background?/path/to/project/entrypoints/background.ts
        const index = id.indexOf(VIRTUAL_ID);
        if (index === -1) return;

        const inputPath = normalizePath(
          id.substring(index + VIRTUAL_ID.length),
        );

        return RESOLVED_VIRTUAL_ID + inputPath;
      },
      async load(id) {
        if (!id.startsWith(RESOLVED_VIRTUAL_ID)) return;

        const inputPath = id.replace(RESOLVED_VIRTUAL_ID, '');
        const TEMPLATE = await fs.readFile(
          resolve(config.wxtModuleDir, `dist/virtual/${name}.mjs`),
          'utf-8',
        );

        return TEMPLATE.replace(`virtual:user-${name}`, inputPath);
      },
    };
  });
}
