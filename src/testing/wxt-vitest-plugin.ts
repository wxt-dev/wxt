import * as vite from 'vite';
import {
  unimport,
  download,
  tsconfigPaths,
  globals,
  webextensionPolyfillAlias,
} from '../core/vite-plugins';
import { getInternalConfig } from '../core/utils/getInternalConfig';
import { InlineConfig } from '../core/types';

/**
 * Vite plugin that configures Vitest with everything required to test a WXT extension, based on the `<root>/wxt.config.ts`
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
 *
 * @param inlineConfig Customize WXT's config for testing. Any config specified here overrides the config from your `wxt.config.ts` file.
 */
export function WxtVitest(inlineConfig?: InlineConfig): vite.PluginOption {
  return getInternalConfig(inlineConfig ?? {}, 'serve').then((config) => [
    webextensionPolyfillAlias(),
    unimport(config),
    globals(config),
    download(config),
    tsconfigPaths(config),
  ]);
}
