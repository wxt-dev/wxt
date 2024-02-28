import type * as vite from 'vite';
import {
  unimport,
  download,
  tsconfigPaths,
  globals,
  webextensionPolyfillMock,
} from '../core/builders/vite/plugins';
import { resolveConfig } from '~/core/utils/building';
import { InlineConfig } from '../types';

/**
 * Vite plugin that configures Vitest with everything required to test a WXT extension, based on the `<root>/wxt.config.ts`
 *
 * ```ts
 * // vitest.config.ts
 * import { defineConfig } from 'vitest/config';
 * import { WxtVitest } from 'wxt/testing';
 *
 * export default defineConfig({
 *   plugins: [WxtVitest()],
 * });
 * ```
 *
 * @param inlineConfig Customize WXT's config for testing. Any config specified here overrides the config from your `wxt.config.ts` file.
 */
export function WxtVitest(inlineConfig?: InlineConfig): vite.PluginOption {
  return resolveConfig(inlineConfig ?? {}, 'serve').then((config) => [
    webextensionPolyfillMock(config),
    unimport(config),
    globals(config),
    download(config),
    tsconfigPaths(config),
  ]);
}
