import { createUnimport } from 'unimport';
import { InternalConfig } from '~/types';
import { getUnimportOptions } from '~/core/utils/unimport';
import * as vite from 'vite';
import { extname } from 'path';

const ENABLED_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.vue',
  '.svelte',
]);

/**
 * Inject any global imports defined by unimport
 */
export function unimport(config: InternalConfig): vite.PluginOption {
  const options = getUnimportOptions(config);
  if (options === false) return [];

  const unimport = createUnimport(options);

  return {
    name: 'wxt:unimport',
    async config() {
      await unimport.scanImportsFromDir(undefined, { cwd: config.srcDir });
    },
    async transform(code, id) {
      // Don't transform dependencies
      if (id.includes('node_modules')) return;

      // Don't transform non-js files
      if (!ENABLED_EXTENSIONS.has(extname(id))) return;

      return unimport.injectImports(code, id);
    },
  };
}
