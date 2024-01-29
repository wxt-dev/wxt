import { createUnimport } from 'unimport';
import { InternalConfig } from '~/types';
import { getUnimportOptions } from '~/core/utils/unimport';
import type * as vite from 'vite';
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
export function unimport(
  config: Omit<InternalConfig, 'builder'>,
): vite.PluginOption {
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

      const injected = await unimport.injectImports(code, id);
      return {
        code: injected.code,
        map: injected.s.generateMap({ hires: 'boundary', source: id }),
      };
      // return
    },
  };
}
