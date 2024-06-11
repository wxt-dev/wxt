/**
 * Utilities for creating reusable, build-time modules for WXT.
 *
 * @module wxt/modules
 */
import type {
  Entrypoint,
  Wxt,
  WxtModule,
  WxtModuleOptions,
  WxtModuleSetup,
} from './types';
import * as vite from 'vite';
import glob from 'fast-glob';
import { resolve } from 'node:path';

export function defineWxtModule<TOptions extends WxtModuleOptions>(
  module: WxtModule<TOptions> | WxtModuleSetup<TOptions>,
): WxtModule<TOptions> {
  if (typeof module === 'function') return { setup: module };
  return module;
}

/**
 * Adds a TS/JS file as an entrypoint to the project. This file will be bundled
 * along with the other entrypoints.

 * If you're publishing the module to NPM, you should probably pre-build the
 * entrypoint and use `addPublicAssets` instead to copy pre-bundled assets into
 * the output directory. This will speed up project builds since it just has to
 * copy some files instead of bundling them.
 *
 * @param wxt The wxt instance provided by the module's setup function.
 * @param entrypoint The entrypoint to be bundled along with the extension.
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
 * @param wxt The wxt instance provided by the module's setup function.
 * @param dir The directory to copy.
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
 * up individual builds. Config in the project's `wxt.config.ts` file takes
 * precedence over any config added by this function.
 *
 * @param wxt The wxt instance provided by the module's setup function.
 * @param viteConfig A function that returns the vite config the module is
                     adding. Same format as `vite` in `wxt.config.ts`.
 *
 * @example
 * export default defineWxtModule((wxt, options) => {
 *   addViteConfig(wxt, () => ({
 *     build: {
 *       sourceMaps: true,
 *     },
 *   });
 * });
 */
export function addViteConfig(
  wxt: Wxt,
  viteConfig: (env: vite.ConfigEnv) => vite.UserConfig | undefined,
): void {
  wxt.hooks.hook('ready', (wxt) => {
    const userVite = wxt.config.vite;
    wxt.config.vite = (env) =>
      vite.mergeConfig(
        // Use config added by module as base
        viteConfig(env) ?? {},
        // Overwrite module config with user config
        userVite(env),
      );
  });
}

/**
 * Add a runtime plugin to the project. In each entrypoint, before executing
 * the `main` function, plugins are executed.
 *
 * @param wxt The wxt instance provided by the module's setup function.
 * @param plugin An import from an NPM module, or an absolute file path to the
 *               file to load at runtime.
 *
 * @example
 * export default defineWxtModule((wxt) => {
 *   addWxtPlugin(wxt, "wxt-module-analytics/client-plugin");
 * });
 */
export function addWxtPlugin(wxt: Wxt, plugin: string) {
  wxt.hooks.hook('ready', (wxt) => {
    wxt.config.plugins.push(plugin);
  });
}
