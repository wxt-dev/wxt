import { ResolvedConfig } from '~/types';
import * as vite from 'vite';
import { normalizePath } from '~/core/utils/paths';
import { removeMainFunctionCode } from '~/core/utils/transform';
import { resolve } from 'node:path';

/**
 * Transforms entrypoints, removing their main function.
 */
export function removeEntrypointMainFunction(
  config: ResolvedConfig,
  path: string,
): vite.Plugin {
  const absPath = normalizePath(resolve(config.root, path));
  return {
    name: 'wxt:remove-entrypoint-main-function',
    transform(code, id) {
      if (id === absPath) return removeMainFunctionCode(code);
    },
  };
}
