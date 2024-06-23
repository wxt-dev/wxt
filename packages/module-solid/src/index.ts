import 'wxt';
import { addImportPreset, addViteConfig, defineWxtModule } from 'wxt/modules';
import solid, { Options as PluginOptions } from 'vite-plugin-solid';

export default defineWxtModule<SolidModuleOptions>({
  name: '@wxt-dev/module-solid',
  configKey: 'solid',
  setup(wxt, options) {
    const { vite } = options ?? {};

    addViteConfig(wxt, () => ({
      plugins: [solid(vite)],
      build: {
        target: 'esnext',
      },
    }));

    addImportPreset(wxt, 'solid-js');
  },
});

export interface SolidModuleOptions {
  vite?: PluginOptions;
}

declare module 'wxt' {
  export interface InlineConfig {
    solid?: SolidModuleOptions;
  }
}
