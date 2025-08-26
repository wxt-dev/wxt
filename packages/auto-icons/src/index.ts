import 'wxt';
import { defineWxtModule } from 'wxt/modules';
import { resolve, relative } from 'node:path';
import defu from 'defu';
import sharp from 'sharp';
import { ensureDir, exists } from 'fs-extra';

export default defineWxtModule<AutoIconsOptions>({
  name: '@wxt-dev/auto-icons',
  configKey: 'autoIcons',
  async setup(wxt, options) {
    const parsedOptions = defu<Required<AutoIconsOptions>, AutoIconsOptions[]>(
      options,
      {
        enabled: true,
        baseIconPath: resolve(wxt.config.srcDir, 'assets/icon.png'),
        developmentIndicator: 'grayscale',
        sizes: [128, 48, 32, 16],
      },
    );

    // Backward compatibility for the deprecated option
    if (options?.grayscaleOnDevelopment !== undefined) {
      wxt.logger.warn(
        '`[auto-icons]` "grayscaleOnDevelopment" is deprecated. Use "developmentIndicator" instead.',
      );

      if (options?.developmentIndicator === undefined) {
        parsedOptions.developmentIndicator = options!.grayscaleOnDevelopment
          ? 'grayscale'
          : false;
      }
    }

    const resolvedPath = resolve(wxt.config.srcDir, parsedOptions.baseIconPath);

    if (!parsedOptions.enabled)
      return wxt.logger.warn(`\`[auto-icons]\` ${this.name} disabled`);

    if (!(await exists(resolvedPath))) {
      return wxt.logger.warn(
        `\`[auto-icons]\` Skipping icon generation, no base icon found at ${relative(process.cwd(), resolvedPath)}`,
      );
    }

    wxt.hooks.hook('build:manifestGenerated', async (wxt, manifest) => {
      if (manifest.icons)
        return wxt.logger.warn(
          '`[auto-icons]` icons property found in manifest, overwriting with auto-generated icons',
        );

      manifest.icons = Object.fromEntries(
        parsedOptions.sizes.map((size) => [size, `icons/${size}.png`]),
      );
    });

    wxt.hooks.hook('build:done', async (wxt, output) => {
      const outputFolder = wxt.config.outDir;

      for (const size of parsedOptions.sizes) {
        const resizedImage = sharp(resolvedPath).resize(size).png();

        if (wxt.config.mode === 'development') {
          if (parsedOptions.developmentIndicator === 'grayscale') {
            resizedImage.grayscale();
          } else if (parsedOptions.developmentIndicator === 'overlay') {
            // Helper to build an overlay that places a yellow rectangle at the bottom
            // of the icon with the text "DEV" in black. The overlay has the same
            // dimensions as the icon so we can composite it with default gravity.
            const buildDevOverlay = (size: number) => {
              const rectHeight = Math.round(size * 0.5);
              const fontSize = Math.round(size * 0.35);

              return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="${size - rectHeight}" width="${size}" height="${rectHeight}" fill="#ffff00" />
                  <text x="${size / 2}" y="${size - rectHeight / 2}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="black" text-anchor="middle" dominant-baseline="middle">DEV</text>
                </svg>`);
            };
            const overlayBuffer = await sharp(buildDevOverlay(size))
              .png()
              .toBuffer();

            resizedImage.composite([
              {
                input: overlayBuffer,
                left: 0,
                top: 0,
              },
            ]);
          }
        }

        ensureDir(resolve(outputFolder, 'icons'));
        await resizedImage.toFile(resolve(outputFolder, `icons/${size}.png`));

        output.publicAssets.push({
          type: 'asset',
          fileName: `icons/${size}.png`,
        });
      }
    });

    wxt.hooks.hook('prepare:publicPaths', (wxt, paths) => {
      for (const size of parsedOptions.sizes) {
        paths.push(`icons/${size}.png`);
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
   *
   * Path is relative to the project's src directory.
   * @default "<srcDir>/assets/icon.png"
   */
  baseIconPath?: string;
  /**
   * Apply a visual indicator to the icon when running in development mode.
   *
   * "grayscale" converts the icon to grayscale.
   * "overlay" covers the bottom half with a yellow rectangle and writes "DEV" in black text.
   * Set to `false` to disable any indicator.
   *
   * @default "grayscale"
   */
  developmentIndicator?: 'grayscale' | 'overlay' | false;
  /**
   * Grayscale the image when in development mode to indicate development
   * @default true
   * @deprecated Use `developmentIndicator` instead
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
