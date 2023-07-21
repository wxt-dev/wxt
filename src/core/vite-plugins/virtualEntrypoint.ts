import { Plugin } from 'vite';
import { Entrypoint, InternalConfig } from '../types';
import fs from 'fs-extra';
import { resolve } from 'path';
import { normalizePath } from '../utils/paths';

/**
 * Wraps a user's entrypoint with a vitual version with additional logic.
 */
export function virtualEntrypoin(
  type: Entrypoint['type'],
  config: InternalConfig,
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
        resolve(
          config.root,
          `node_modules/wxt/dist/virtual-modules/${type}-entrypoint.js`,
        ),
        'utf-8',
      );
      return template.replace(`virtual:user-${type}`, inputPath);
    },
  };
}
