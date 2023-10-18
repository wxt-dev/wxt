import * as vite from 'vite';
import { unimport } from '../core/vite-plugins';
import { getInternalConfig } from '../core/utils/getInternalConfig';

/**
 * Vite plugin for adding WXT's auto-imports to Vitest.
 *
 * ```ts
 * // vitest.config.ts
 * import { defineConfig } from 'vitest/config';
 * import { AutoImport } from 'wxt/testing';
 *
 * export default defineConfig({
 *   plugins: [AutoImport()],
 * });
 * ```
 */
export function AutoImport(root?: string): vite.Plugin {
  return {
    name: 'wxt/testing:imports',
    async config() {
      const internalConfig = await getInternalConfig({ root }, 'build');
      return {
        plugins: [unimport(internalConfig)],
      };
    },
  };
}
