import { Plugin } from 'vite';
import { InternalConfig, VirtualEntrypointType } from '~/types';
import fs from 'fs-extra';
import { resolve } from 'path';
import { normalizePath } from '~/core/utils/paths';
import { getEntrypointName } from '~/core/utils/entrypoints';

/**
 * Wraps a user's entrypoint with a vitual version with additional logic.
 */
export function virtualEntrypoint(
  type: VirtualEntrypointType,
  config: Omit<InternalConfig, 'builder'>,
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
      const entrypointName = getEntrypointName(
        config.entrypointsDir,
        inputPath,
      );
      if (!entrypointName)
        throw Error('Entrypoint name could not be detected: ' + inputPath);

      console.log({ inputPath, entrypointName });

      const template = await fs.readFile(
        resolve(
          config.root,
          `node_modules/wxt/dist/virtual/${type}-entrypoint.js`,
        ),
        'utf-8',
      );
      return template
        .replace(`virtual:user-${type}`, inputPath)
        .replaceAll('__ENTRYPOINT__', JSON.stringify(entrypointName));
    },
  };
}
