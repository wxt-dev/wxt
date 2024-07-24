import type * as vite from 'vite';
import {
  download,
  tsconfigPaths,
  globals,
  extensionApiMock,
  resolveAppConfig,
} from '../core/builders/vite/plugins';
import { resolveConfig } from '../core/utils/building';
import { InlineConfig } from '../types';
import { vitePlugin as unimportPlugin } from '../builtin-modules/unimport';
import { createUnimport } from 'unimport';

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
export async function WxtVitest(
  inlineConfig?: InlineConfig,
): Promise<vite.PluginOption[]> {
  const config = await resolveConfig(inlineConfig ?? {}, 'serve');

  const plugins: vite.PluginOption[] = [
    globals(config),
    download(config),
    tsconfigPaths(config),
    resolveAppConfig(config),
    extensionApiMock(config),
  ];
  if (config.imports !== false) {
    const unimport = createUnimport(config.imports);
    await unimport.init();
    plugins.push(unimportPlugin(unimport));
  }

  return plugins;
}
