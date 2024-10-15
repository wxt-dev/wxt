import 'wxt';
import { defineWxtModule } from 'wxt/modules';
import defu from 'defu';
import UnoCSS from 'unocss/vite';
import { resolve } from 'node:path';
import { globSync } from 'fast-glob';

export default defineWxtModule<UnoCSSOptions>({
  name: '@wxt-dev/unocss',
  configKey: 'unocss',
  async setup(wxt, options) {
    const parsedOptions = defu<Required<UnoCSSOptions>, UnoCSSOptions[]>(
      options,
      {
        enabled: true,
        entrypoints: ['entrypoints/**/*.ts'],
      },
    );

    if (!parsedOptions.enabled)
      return wxt.logger.warn(`\`[unocss]\` ${this.name} disabled`);

    const parsedEntrypoints = parsedOptions.entrypoints.map((entrypoint) =>
      resolve(wxt.config.srcDir, entrypoint),
    );

    wxt.hooks.hook('vite:devServer:extendConfig', (config) => {
      config.plugins?.push(UnoCSS());
    });

    wxt.hooks.hook('vite:build:extendConfig', (entries, config) => {
      const entrypoint = entries.find((f) =>
        parsedEntrypoints.some((entrypoint) =>
          globSync(entrypoint).some((path) => f.inputPath.endsWith(path)),
        ),
      );

      if (!entrypoint) return;

      config.plugins?.push(UnoCSS());
    });
  },
});

/**
 * Options for the UnoCSS module
 */
export interface UnoCSSOptions {
  /**
   * Enable UnoCSS
   * @default true
   */
  enabled?: boolean;
  /**
   * Entrypoints to use UnoCSS for
   * @default <srcDir>/entrypoints/**\/*.ts
   */
  entrypoints?: string[];
}

declare module 'wxt' {
  export interface InlineConfig {
    unocss?: UnoCSSOptions;
  }
}
