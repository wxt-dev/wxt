import 'wxt';
import { defineWxtModule, addWxtPlugin, addPublicAssets } from 'wxt/modules';
import { resolve } from 'node:path';

export default defineWxtModule<DevtoolsModuleOptions>({
  name: '@wxt-dev/devtools',
  configKey: 'devtools',

  setup(wxt, options) {
    if (options?.enabled === false)
      return wxt.logger.info('WXT devtools: `disabled`');
    wxt.logger.info('WXT devtools `enabled`');

    // Load plugin code in all entrypoints
    addWxtPlugin(wxt, resolve(__dirname, '../dist/plugin.mjs'));

    // Copy UI into extension bundle
    addPublicAssets(wxt, resolve(__dirname, '../dist/prebuilt'));

    // Add required permissions
    wxt.hooks.hook('build:manifestGenerated', (_, manifest) => {
      addPermission(manifest, 'tabs');
      addPermission(manifest, 'windows');
      addPermission(manifest, 'contextMenus');
    });
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
