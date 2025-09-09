import { ResolvedConfig } from '../../../../types';
import * as vite from 'vite';
import { normalizePath } from '../../../utils/paths';
import { removeMainFunctionCode } from '../../../utils/transform';
import { resolve } from 'node:path';

/**
 * Transforms entrypoints, removing the main function from the entrypoint if it exists.
 */
export function removeEntrypointMainFunction(
  config: ResolvedConfig,
  path: string,
): vite.Plugin {
  const absPath = normalizePath(resolve(config.root, path));
  return {
    name: 'wxt:remove-entrypoint-main-function',
    transform: {
      order: 'pre',
      filter: {
        id: new RegExp(`^${absPath}$`),
      },
      handler(code) {
        const newCode = removeMainFunctionCode(code);
        config.logger.debug('vite-node transformed entrypoint', path);
        config.logger.debug(`Original:\n---\n${code}\n---`);
        config.logger.debug(`Transformed:\n---\n${newCode.code}\n---`);
        return newCode;
      },
    },
  };
}
