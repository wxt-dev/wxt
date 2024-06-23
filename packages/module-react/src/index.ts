import 'wxt';
import { addImportPreset, addViteConfig, defineWxtModule } from 'wxt/modules';
import react, { Options as PluginOptions } from '@vitejs/plugin-react';

export default defineWxtModule<ReactModuleOptions>({
  name: '@wxt-dev/module-react',
  configKey: 'react',
  setup(wxt, options) {
    const { vite } = options ?? {};

    addViteConfig(wxt, () => ({
      plugins: [react(vite)],
    }));

    addImportPreset(wxt, 'react');
  },
});

export interface ReactModuleOptions {
  vite?: PluginOptions;
}

declare module 'wxt' {
  export interface InlineConfig {
    react?: ReactModuleOptions;
  }
}
