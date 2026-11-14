import { resolve } from 'node:path';

import type * as vite from 'vite';

import { normalizePath } from '../../../../internal-utils/path-utils';
import { ResolvedConfig } from '../../../../types';
import { removeMainFunctionCode } from '../../../transform';

/**
 * Transforms entrypoints, removing the main function from the entrypoint if it
 * exists.
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
        // Escaped, since paths can contain regex syntax (e.g. `+` in a git worktree named after `feat/x`)
        id: new RegExp(`^${escapeRegExp(absPath)}$`),
      },
      handler(code) {
        const newCode = removeMainFunctionCode(code);
        config.logger.debug('transformed entrypoint', path);
        config.logger.debug(`Original:\n---\n${code}\n---`);
        config.logger.debug(`Transformed:\n---\n${newCode.code}\n---`);
        return newCode;
      },
    },
  };
}

/**
 * Escapes a string for use as a literal in a `RegExp` (`RegExp.escape()` needs
 * Node 24)
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
