//
// THIS FILE IS ONLY USED FOR DEVELOPMENT.
// It enables HMR and other nice things for the UI. The module shipped by NPM
// is located at `./prod.ts`
//

import 'wxt';
import {
  addEntrypoint,
  addPublicAssets,
  addWxtPlugin,
  defineWxtModule,
} from 'wxt/modules';
import { resolve } from 'node:path';

/** `true` when consumed as an NPM module, not defined while developing this plugin */
declare const __IS_PRODUCTION__: boolean;

export default defineWxtModule<DevtoolsModuleOptions>({
  name: '@wxt-dev/devtools',
  configKey: 'devtools',
  setup(wxt, options) {
    // Never enable when enabled is set to false
    if (options?.enabled === false) {
      return wxt.logger.info('`[devtools]` Disabled');
    }
    if (
      options?.enabled === undefined &&
      wxt.config.command === 'build' &&
      wxt.config.mode === 'production'
    ) {
      return wxt.logger.info('`[devtools]` Skipped for production builds');
    }

    wxt.logger.info('`[devtools]` Included in extension');

    // Add required permissions
    wxt.hooks.hook('build:manifestGenerated', (wxt, manifest) => {
      addPermission(manifest, 'tabs');
      addPermission(manifest, 'windows');
      addPermission(manifest, 'contextMenus');
    });

    // Add plugin
    if (typeof __IS_PRODUCTION__ !== 'undefined' && __IS_PRODUCTION__) {
      addWxtPlugin(wxt, resolve(__dirname, 'plugin.mjs'));
    } else {
      addWxtPlugin(wxt, resolve(__dirname, 'plugin/index.ts'));
    }

    // Add UI
    if (typeof __IS_PRODUCTION__ !== 'undefined' && __IS_PRODUCTION__) {
      addPublicAssets(wxt, resolve(__dirname, 'prebuilt'));
    } else {
      addEntrypoint(wxt, {
        type: 'unlisted-page',
        name: 'wxt-devtools',
        inputPath: resolve(__dirname, 'wxt-devtools.html'),
        options: {},
        outputDir: wxt.config.outDir,
        skipped: false,
      });
    }
  },
});

export interface DevtoolsModuleOptions {
  /** @default true */
  enabled?: boolean;
}

declare module 'wxt' {
  export interface InlineConfig {
    devtools?: DevtoolsModuleOptions;
  }
}

function addPermission(manifest: any, permission: string): void {
  manifest.permissions ??= [];
  if (manifest.permissions.includes(permission)) return;
  manifest.permissions.push(permission);
}
