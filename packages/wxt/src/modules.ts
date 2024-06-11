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
import glob from 'fast-glob';
import { resolve } from 'node:path';

export function defineWxtModule<TOptions extends WxtModuleOptions>(
  module: WxtModule<TOptions> | WxtModule<TOptions>['setup'],
): WxtModule<TOptions> {
  if (typeof module === 'function') return { setup: module };
  return module;
}

/**
 * Adds a TS/JS file as an entrypoint to the project. This file will be bundled
 * along with the other entrypoints. To keep builds fast, you should probably use
 * `copyAssets` instead to copy pre-bundled assets into the output directory.
 *
 * @argument wxt The wxt instance provided by the module's setup function.
 * @argument entrypoint The entrypoint to be bundled along with the extension.
 *
 * @example
 * export default defineWxtModule((wxt, options) => {
 *   addEntrypoint(wxt, {
 *     type: "unlisted-page",
 *     name: "changelog",
 *     inputPath: "wxt-module-changelog/index.html"
 *     outputDir: wxt.config.outputDir,
 *     options: {},
 *   });
 * });
 */
export function addEntrypoint(wxt: Wxt, entrypoint: Entrypoint): void {
  wxt.hooks.hook('entrypoints:resolved', (wxt, entrypoints) => {
    entrypoints.push(entrypoint);
  });
}

/**
 * Copy files inside a directory (as if it were the public directory) into the
 * extension's output directory. The directory itself is not copied, just the
 * files inside it. If a filename matches an existing one, it is ignored.
 *
 * @argument wxt The wxt instance provided by the module's setup function.
 * @argument dir The directory to copy.
 *
 * @example
 * export default defineWxtModule((wxt, options) => {
 *   addPublicAssets(wxt, "./dist/prebundled");
 * });
 */
export function addPublicAssets(wxt: Wxt, dir: string): void {
  wxt.hooks.hook('build:publicAssets', async (wxt, files) => {
    const moreFiles = await glob('**/*', { cwd: dir });
    if (moreFiles.length === 0) {
      wxt.logger.warn('No files to copy in', dir);
      return;
    }
    moreFiles.forEach((file) => {
      files.unshift({ absoluteSrc: resolve(dir, file), relativeDest: file });
    });
  });
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
 * export default defineWxtModule((wxt, options) => {
 *   mergeViteConfig(wxt, (group) => ({
 *     build: {
 *       sourceMaps: true,
 *     },
 *   });
 * });
 */
export function mergeViteConfig(
  wxt: Wxt,
  viteConfig: (group: EntrypointGroup) => vite.UserConfig | undefined,
): void {
  throw Error('TODO');
}
