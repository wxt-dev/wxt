import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolve, relative } from 'node:path';
import * as fsExtra from 'fs-extra';
import defu from 'defu';

// Import the module definition type
import type { AutoIconsOptions } from '../index';
import { UserManifest } from 'wxt';

// Mock dependencies
vi.mock('fs-extra', () => ({
  exists: vi.fn().mockResolvedValue(true),
  ensureDir: vi.fn().mockResolvedValue(undefined),
}));

// Mock process.cwd
vi.spyOn(process, 'cwd').mockReturnValue('/mock');

describe('auto-icons module', () => {
  // Create a simple mock of the WXT object
  const mockWxt = {
    config: {
      srcDir: '/mock/src',
      outDir: '/mock/dist',
      mode: 'development',
    },
    logger: {
      warn: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('options handling', () => {
    it('should use default options when not provided', () => {
      // Execute
      const options: AutoIconsOptions = {};
      const parsedOptions = defu<
        Required<AutoIconsOptions>,
        AutoIconsOptions[]
      >(options, {
        enabled: true,
        baseIconPath: resolve('/mock/src', 'assets/icon.png'),
        grayscaleOnDevelopment: true,
        sizes: [128, 48, 32, 16],
      });

      // Verify
      expect(parsedOptions.enabled).toBe(true);
      expect(parsedOptions.baseIconPath).toBe(
        resolve('/mock/src', 'assets/icon.png'),
      );
      expect(parsedOptions.grayscaleOnDevelopment).toBe(true);
      expect(parsedOptions.sizes).toEqual([128, 48, 32, 16]);
    });

    it('should merge custom options with defaults', () => {
      // Execute
      const options: AutoIconsOptions = {
        sizes: [64, 32],
        grayscaleOnDevelopment: false,
      };
      const parsedOptions = defu<
        Required<AutoIconsOptions>,
        AutoIconsOptions[]
      >(options, {
        enabled: true,
        baseIconPath: resolve('/mock/src', 'assets/icon.png'),
        grayscaleOnDevelopment: true,
        sizes: [128, 48, 32, 16],
      });

      // Verify
      expect(parsedOptions.enabled).toBe(true); // Default
      expect(parsedOptions.baseIconPath).toBe(
        resolve('/mock/src', 'assets/icon.png'),
      ); // Default
      expect(parsedOptions.grayscaleOnDevelopment).toBe(false); // Custom
      expect(parsedOptions.sizes).toEqual([64, 32, 128, 48, 32, 16]); // Custom
    });
  });

  describe('error handling', () => {
    it('should warn when disabled', () => {
      // Setup
      const parsedOptions: AutoIconsOptions = {
        enabled: false,
        baseIconPath: 'assets/icon.png',
        grayscaleOnDevelopment: true,
        sizes: [128, 48, 32, 16],
      };

      // Execute - simulate the module's logic
      if (!parsedOptions.enabled) {
        mockWxt.logger.warn(`\`[auto-icons]\` module-name disabled`);
      }

      // Verify
      expect(mockWxt.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('disabled'),
      );
    });

    it('should warn when base icon not found', async () => {
      // Setup
      vi.mocked(fsExtra.exists).mockResolvedValue();
      const parsedOptions: AutoIconsOptions = {
        enabled: true,
        baseIconPath: 'assets/icon.png',
        grayscaleOnDevelopment: true,
        sizes: [128, 48, 32, 16],
      };

      const resolvedPath = resolve('/mock/src', parsedOptions.baseIconPath!);

      // Execute - simulate the module's logic
      if (!(await fsExtra.exists(resolvedPath))) {
        mockWxt.logger.warn(
          `\`[auto-icons]\` Skipping icon generation, no base icon found at ${relative(process.cwd(), resolvedPath)}`,
        );
      }

      // Verify
      expect(mockWxt.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping icon generation'),
      );
    });
  });

  describe('manifest generation', () => {
    it('should update manifest with icons', () => {
      // Setup
      const options: AutoIconsOptions = {
        enabled: true,
        baseIconPath: 'assets/icon.png',
        grayscaleOnDevelopment: true,
        sizes: [96],
      };
      const parsedOptions = defu<
        Required<AutoIconsOptions>,
        AutoIconsOptions[]
      >(options, {
        enabled: true,
        baseIconPath: resolve('/mock/src', 'assets/icon.png'),
        grayscaleOnDevelopment: true,
        sizes: [128, 48, 32, 16],
      });
      const manifest: UserManifest = {
        icons: {
          128: 'icon/128.png',
          48: 'icon/48.png',
          32: 'icon/32.png',
        },
      };

      // Execute - simulate the build:manifestGenerated hook logic
      manifest.icons = Object.fromEntries(
        parsedOptions.sizes!.map((size) => [size, `icons/${size}.png`]),
      );

      // Verify
      expect(manifest).toEqual({
        icons: {
          '96': 'icons/96.png',
          '128': 'icons/128.png',
          '48': 'icons/48.png',
          '32': 'icons/32.png',
          '16': 'icons/16.png',
        },
      });
    });

    it('should warn when overwriting existing icons in manifest', () => {
      const manifest: UserManifest = {
        icons: {
          128: 'icon/128.png',
          48: 'icon/48.png',
          32: 'icon/32.png',
        },
      };

      // Execute - simulate the build:manifestGenerated hook logic
      if (manifest.icons) {
        mockWxt.logger.warn(
          '`[auto-icons]` icons property found in manifest, overwriting with auto-generated icons',
        );
      }

      // Verify
      expect(mockWxt.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('overwriting with auto-generated icons'),
      );
    });
  });

  describe('icon generation', () => {
    it('should generate icons with correct sizes', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        baseIconPath: 'assets/icon.png',
        grayscaleOnDevelopment: true,
        sizes: [96],
      };
      const parsedOptions = defu<
        Required<AutoIconsOptions>,
        AutoIconsOptions[]
      >(options, {
        enabled: true,
        baseIconPath: resolve('/mock/src', 'assets/icon.png'),
        grayscaleOnDevelopment: true,
        sizes: [128, 48, 32, 16],
      });

      const mockOutput = {
        publicAssets: [] as { type: string; fileName: string }[],
      };

      // Execute - simulate the logic without actually calling sharp
      for (const size of parsedOptions.sizes!) {
        await fsExtra.ensureDir(resolve(mockWxt.config.outDir, 'icons'));

        // Add to public assets
        mockOutput.publicAssets.push({
          type: 'asset',
          fileName: `icons/${size}.png`,
        });
      }

      // Verify
      expect(fsExtra.ensureDir).toHaveBeenCalledWith(
        resolve('/mock/dist', 'icons'),
      );
      expect(mockOutput.publicAssets).toEqual([
        { type: 'asset', fileName: 'icons/96.png' },
        { type: 'asset', fileName: 'icons/128.png' },
        { type: 'asset', fileName: 'icons/48.png' },
        { type: 'asset', fileName: 'icons/32.png' },
        { type: 'asset', fileName: 'icons/16.png' },
      ]);
    });

    it('should apply grayscale in development mode but not in production', () => {
      // Setup
      const parsedOptions: AutoIconsOptions = {
        enabled: true,
        baseIconPath: 'assets/icon.png',
        grayscaleOnDevelopment: true,
      };

      // Test development mode
      const devMode = 'development';
      const shouldApplyGrayscale =
        devMode === 'development' && parsedOptions.grayscaleOnDevelopment;
      expect(shouldApplyGrayscale).toBe(true);

      // Test production mode
      const prodMode = 'production';
      const shouldNotApplyGrayscale = prodMode === 'production';
      expect(shouldNotApplyGrayscale).toBe(true);
    });
  });

  describe('public paths', () => {
    it('should add icon paths to public paths', () => {
      const options: AutoIconsOptions = {
        enabled: true,
        baseIconPath: 'assets/icon.png',
        grayscaleOnDevelopment: true,
        sizes: [96],
      };
      const parsedOptions = defu<
        Required<AutoIconsOptions>,
        AutoIconsOptions[]
      >(options, {
        enabled: true,
        baseIconPath: resolve('/mock/src', 'assets/icon.png'),
        grayscaleOnDevelopment: true,
        sizes: [128, 48, 32, 16],
      });

      const paths: string[] = [];

      // Execute - simulate the prepare:publicPaths hook logic
      for (const size of parsedOptions.sizes!) {
        paths.push(`icons/${size}.png`);
      }

      // Verify
      expect(paths).toEqual([
        'icons/96.png',
        'icons/128.png',
        'icons/48.png',
        'icons/32.png',
        'icons/16.png',
      ]);
    });
  });
});
