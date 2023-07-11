import { createUnimport } from 'unimport';
import { InternalConfig } from '../types';
import { getUnimportOptions } from '../utils/auto-imports';
import { Plugin } from 'vite';
import { extname } from 'path';

const ENABLED_EXTENSIONS: Record<string, boolean | undefined> = {
  '.js': true,
  '.jsx': true,
  '.ts': true,
  '.tsx': true,
  '.vue': true,
  '.svelte': true,
};

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
      const ext = extname(id);
      if (ENABLED_EXTENSIONS[ext]) return unimport.injectImports(code, id);
    },
  };
}
