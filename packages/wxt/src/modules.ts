/**
 * Utilities for creating reusable, build-time modules for WXT.
 *
 * @module wxt/modules
 */
import type {
  Entrypoint,
  EntrypointGroup,
  Wxt,
  WxtModule,
  WxtModuleOptions,
} from './types';
import * as vite from 'vite';

export function defineWxtModule<TOptions extends WxtModuleOptions>(
  module: WxtModule<TOptions> | WxtModule<TOptions>['setup'],
): WxtModule<TOptions> {
  if (typeof module === 'function') return { setup: module };
  return module;
}

/**
 * Adds a TS/JS file as an entrypoint to the project.
 *
 * @argument wxt The wxt instance provided by the module's setup function.
 * @argument entrypoint The entrypoint to be bundled along with the extension.
 *
 * @example
 * export default defineWxtPlugin({
 *   setup(wxt) {
 *     addEntrypoint(wxt, {
 *       type: "unlisted-page",
 *       name: "changelog",
 *       inputPath: "wxt-module-changelog/index.html"
 *       outputDir: wxt.config.outputDir,
 *       options: {},
 *     });
 *   }
 * });
 */
export function addEntrypoint(wxt: Wxt, entrypoint: Entrypoint): void {
  throw Error('TODO');
}

/**
 * Merge additional vite config for one or more entrypoint "groups" that make
 * up individual builds.
 *
 * @argument wxt The wxt instance provided by the module's setup function.
 * @argument viteConfig A callback function taking the entrypoints that will be
 *                      built as the first argument and returns additional Vite
 *                      config that will be merged into the config used to
 *                      bundle the entrypoint group.
 *
 * @example
 * export default defineWxtPlugin({
 *   setup(wxt) {
 *     mergeViteConfig(wxt, (group) => ({
 *       build: {
 *         sourceMaps: true,
 *       },
 *     });
 *   }
 * });
 */
export function mergeViteConfig(
  wxt: Wxt,
  viteConfig: (group: EntrypointGroup) => vite.UserConfig | undefined,
): void {
  throw Error('TODO');
}
