import 'wxt';
import { defineWxtModule } from 'wxt/modules';
import { resolve } from 'path';
import defu from 'defu';
import sharp from 'sharp';
import { ensureDir, exists } from 'fs-extra';

export default defineWxtModule<AutoIconsOptions>({
  name: '@wxt-dev/module-auto-icons',
  configKey: 'autoIcons',
  async setup(wxt, options) {
    const parsedOptions = defu(options, {
      enabled: true,
      baseIconsPath: resolve(wxt.config.srcDir, 'assets/icon.png'),
      grayscaleOnDevelopment: true,
      sizes: [128, 48, 32, 16],
    });

    if (!parsedOptions.enabled) return wxt.logger.warn(`${this.name} disabled`);

    if (!(await exists(parsedOptions.baseIconsPath))) {
      return wxt.logger.fatal(
        `Cannot generate icons, no base icon found at ${parsedOptions.baseIconsPath}`,
      );
    }

    wxt.hooks.hook('build:manifestGenerated', async (wxt, manifest) => {
      if (manifest.icons)
        return wxt.logger.warn(
          'icons property found in manifest, overwriting with auto-generated icons',
        );

      manifest.icons = Object.fromEntries(
        parsedOptions.sizes.map((size) => [size, `icons/${size}.png`]),
      );
    });

    wxt.hooks.hook('build:done', async (wxt) => {
      const image = sharp(parsedOptions.baseIconsPath).png();

      if (
        wxt.config.mode === 'development' &&
        parsedOptions.grayscaleOnDevelopment
      ) {
        image.grayscale();
      }

      const outputFolder = wxt.config.outDir;

      for (const size of parsedOptions.sizes) {
        const resized = image.resize(size);
        ensureDir(resolve(outputFolder, 'icons'));
        await resized.toFile(resolve(outputFolder, `icons/${size}.png`));
      }
    });
  },
});

/**
 * Options for the auto-icons module
 */
export interface AutoIconsOptions {
  /**
   * Enable auto-icons generation
   * @default true
   */
  enabled?: boolean;
  /**
   * Path to the image to use.
   * @default "<srcDir>/assets/icon.png"
   */
  baseIconPath?: string;
  /**
   * Grayscale the image when in development mode to indicate development
   * @default true
   */
  grayscaleOnDevelopment?: boolean;
  /**
   * Sizes to generate icons for
   * @default [128, 48, 32, 16]
   */
  sizes?: number[];
}

declare module 'wxt' {
  export interface InlineConfig {
    autoIcons?: AutoIconsOptions;
  }
}
