import { createUnimport } from 'unimport';
import { InternalConfig } from '../types';
import { getUnimportOptions } from '../utils/auto-imports';
import { Plugin } from 'vite';

/**
 * Inject any global imports defined by unimport
 */
export function unimport(config: InternalConfig): Plugin {
  const options = getUnimportOptions(config);
  const unimport = createUnimport(options);

  return {
    name: 'wxt:unimport',
    async config() {
      await unimport.scanImportsFromDir(undefined, { cwd: config.srcDir });
    },
    async transform(code, id) {
      return unimport.injectImports(code, id);
    },
  };
}
