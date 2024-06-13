import type { WxtModule } from 'wxt';
import { addViteConfig, defineWxtModule } from 'wxt/modules';
import vue, { Options as ViteOptions } from '@vitejs/plugin-vue';

// @ts-ignore - required for unbuild to work for now...
let _: WxtModule<any> | undefined;

export default defineWxtModule<VueModuleOptions>({
  name: '@wxt-dev/module-vue',
  configKey: 'vue',
  setup(wxt, options) {
    const { vite } = options ?? {};

    // Add plugin & set sourcemap option
    addViteConfig(wxt, ({ command }) => ({
      // @ts-ignore: Ignore vite version issues
      plugins: [vue(vite)],
      build: {
        // Fixes known issue: https://github.com/wxt-dev/wxt/pull/607
        sourcemap: command !== 'serve',
      },
    }));

    // Enable auto-imports in template files
    wxt.hooks.hook('ready', (wxt) => {
      if (!wxt.config.imports) return;

      wxt.config.imports.addons ??= {};
      if (!Array.isArray(wxt.config.imports.addons)) {
        wxt.config.imports.addons.vueTemplate = true;
      } else {
        wxt.logger.warn(
          'Could not enable auto-imports in vue templates when using and array for imports.addons',
        );
      }
    });

    // Add vue preset to auto-imports
    wxt.hooks.hook('ready', (wxt) => {
      if (!wxt.config.imports) return;

      wxt.config.imports.presets ??= [];
      if (wxt.config.imports.presets.includes('vue')) return;

      wxt.config.imports.presets.push('vue');
    });
  },
});

export interface VueModuleOptions {
  vite?: ViteOptions;
}

declare module 'wxt' {
  export interface InlineConfig {
    vue?: VueModuleOptions;
  }
}
