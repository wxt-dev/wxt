import 'wxt';
import { defineWxtModule } from 'wxt/modules';
import defu from 'defu';
import UnoCSS from 'unocss/vite';

export default defineWxtModule<UnoCSSOptions>({
  name: '@wxt-dev/unocss',
  configKey: 'unocss',
  async setup(wxt, options) {
    const parsedOptions = defu<Required<UnoCSSOptions>, UnoCSSOptions[]>(
      options,
      {
        enabled: true,
        excludeEntrypoints: ['background'],
        configOrPath: undefined,
      },
    );

    if (!parsedOptions.enabled)
      return wxt.logger.warn(`\`[unocss]\` ${this.name} disabled`);

    const excludedEntrypoints = new Set(parsedOptions.excludeEntrypoints);

    wxt.hooks.hook('vite:devServer:extendConfig', (config) => {
      config.plugins?.push(UnoCSS());
    });

    wxt.hooks.hook('vite:build:extendConfig', async (entries, config) => {
      if (entries.every((entry) => excludedEntrypoints.has(entry.name))) return;
      config.plugins?.push(UnoCSS());
    });
  },
});

/**
 * Options for the UnoCSS module
 */
export interface UnoCSSOptions<Theme extends object = object> {
  /**
   * Enable UnoCSS
   * @default true
   */
  enabled?: boolean;
  /**
   * List of entrypoint names that UnoCSS is not used in. By default, the UnoCSS
   * vite plugin is added to all build steps, but this option is used to exclude
   * it from specific builds.
   * @example ["popup", "options"]
   * @default []
   */
  excludeEntrypoints?: string[];
  /**
   * The path to your `unocss.config.ts` file, relative to <rootDir>, or inline configuration.
   */
  configOrPath?: Parameters<typeof UnoCSS<Theme>>[0];
}

declare module 'wxt' {
  export interface InlineConfig {
    unocss?: UnoCSSOptions;
  }
}
