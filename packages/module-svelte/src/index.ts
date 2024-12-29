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
