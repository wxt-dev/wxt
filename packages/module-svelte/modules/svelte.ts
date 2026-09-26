import 'wxt';
import { addImportPreset, addViteConfig, defineWxtModule } from 'wxt/modules';
import {
  svelte,
  vitePreprocess,
  Options as PluginOptions,
} from '@sveltejs/vite-plugin-svelte';

export default defineWxtModule<SvelteModuleOptions>({
  name: '@wxt-dev/module-svelte',
  configKey: 'svelte',
  setup(wxt, options) {
    const { vite } = options ?? {};

    addViteConfig(wxt, ({ mode }) => ({
      plugins: [
        svelte({
          // Using a svelte.config.js file causes a segmentation fault when importing the file
          configFile: false,
          preprocess: [vitePreprocess()],
          ...vite,
        }),
      ],
      resolve: {
        conditions: ['browser', mode],
      },
    }));

    addImportPreset(wxt, 'svelte');

    // Enable auto-imports for Svelte component files
    wxt.hook('config:resolved', (wxt) => {
      // In older versions of WXT, `wxt.config.imports` could be false
      if (!wxt.config.imports) return;

      wxt.config.imports.dirsScanOptions ??= {};
      wxt.config.imports.dirsScanOptions.filePatterns = [
        // Default plus .svelte
        '**/*.{ts,js,mjs,cjs,mts,cts,svelte}',
      ];
    });
  },
});

export interface SvelteModuleOptions {
  vite?: Partial<PluginOptions>;
}

declare module 'wxt' {
  export interface InlineConfig {
    svelte?: SvelteModuleOptions;
  }
}
