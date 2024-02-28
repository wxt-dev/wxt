import { Plugin } from 'vite';
import { ResolvedConfig, VirtualEntrypointType } from '~/types';
import fs from 'fs-extra';
import { resolve } from 'path';
import { normalizePath } from '~/core/utils/paths';

/**
 * Wraps a user's entrypoint with a vitual version with additional logic.
 */
export function virtualEntrypoint(
  type: VirtualEntrypointType,
  config: Omit<ResolvedConfig, 'builder'>,
): Plugin {
  const virtualId = `virtual:wxt-${type}?`;
  const resolvedVirtualId = `\0${virtualId}`;

  return {
    name: `wxt:virtual-entrypoint`,
    resolveId(id) {
      // Id doesn't start with prefix, it looks like this:
      // /path/to/project/virtual:background?/path/to/project/entrypoints/background.ts
      const index = id.indexOf(virtualId);
      if (index === -1) return;

      const inputPath = normalizePath(id.substring(index + virtualId.length));
      return resolvedVirtualId + inputPath;
    },
    async load(id) {
      if (!id.startsWith(resolvedVirtualId)) return;

      const inputPath = id.replace(resolvedVirtualId, '');
      const template = await fs.readFile(
        resolve(config.wxtModuleDir, `dist/virtual/${type}-entrypoint.js`),
        'utf-8',
      );
      return template.replace(`virtual:user-${type}`, inputPath);
    },
  };
}
