import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { resolve } from 'node:path';
import * as fsExtra from 'fs-extra';
import sharp from 'sharp';
import type { Wxt, UserManifest } from 'wxt';

// Import the actual module
import autoIconsModule from '../index';
import type { AutoIconsOptions } from '../index';

// Mock dependencies
vi.mock('fs-extra', () => ({
  exists: vi.fn(),
  ensureDir: vi.fn(),
}));

vi.mock('sharp', () => ({
  default: vi.fn(),
}));

// Type definitions for better type safety
interface MockWxt {
  config: {
    srcDir: string;
    outDir: string;
    mode: 'development' | 'production';
  };
  logger: {
    warn: Mock;
  };
  hooks: {
    hook: Mock;
  };
}

interface PublicAsset {
  type: string;
  fileName: string;
}

interface BuildOutput {
  publicAssets: PublicAsset[];
}

describe('auto-icons module', () => {
  const mockWxt: MockWxt = {
    config: {
      srcDir: '/mock/src',
      outDir: '/mock/dist',
      mode: 'development',
    },
    logger: {
      warn: vi.fn(),
    },
    hooks: {
      hook: vi.fn(),
    },
  };

  const createMockSharpInstance = () => {
    const instance = {
      png: vi.fn(),
      grayscale: vi.fn(),
      resize: vi.fn(),
      toFile: vi.fn().mockResolvedValue(undefined),
    };

    // Make methods chainable
    instance.png.mockReturnValue(instance);
    instance.grayscale.mockReturnValue(instance);
    instance.resize.mockImplementation(() => {
      // Create a new instance for each resize to simulate real sharp behavior
      const resizedInstance = { ...instance };
      resizedInstance.toFile = vi.fn().mockResolvedValue(undefined);
      return resizedInstance;
    });

    return instance;
  };

  let mockSharpInstance: ReturnType<typeof createMockSharpInstance>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSharpInstance = createMockSharpInstance();
    vi.mocked(sharp).mockReturnValue(
      mockSharpInstance as unknown as sharp.Sharp,
    );
    vi.mocked(fsExtra.exists).mockResolvedValue(true as any);
    vi.mocked(fsExtra.ensureDir).mockResolvedValue(undefined as any);
  });

  describe('module setup', () => {
    it('should have correct module metadata', () => {
      expect(autoIconsModule.name).toBe('@wxt-dev/auto-icons');
      expect(autoIconsModule.configKey).toBe('autoIcons');
      expect(typeof autoIconsModule.setup).toBe('function');
    });
  });

  describe('options handling', () => {
    it('should use default options when not provided', async () => {
      const options: AutoIconsOptions = {};

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      // Verify that the module was set up (hooks were registered)
      expect(mockWxt.hooks.hook).toHaveBeenCalledWith(
        'build:manifestGenerated',
        expect.any(Function),
      );
      expect(mockWxt.hooks.hook).toHaveBeenCalledWith(
        'build:done',
        expect.any(Function),
      );
      expect(mockWxt.hooks.hook).toHaveBeenCalledWith(
        'prepare:publicPaths',
        expect.any(Function),
      );
    });

    it('should merge custom options with defaults', async () => {
      const options: AutoIconsOptions = {
        sizes: [64, 32],
        grayscaleOnDevelopment: false,
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      // Verify that the module was set up with custom options
      expect(mockWxt.hooks.hook).toHaveBeenCalledWith(
        'build:manifestGenerated',
        expect.any(Function),
      );
      expect(mockWxt.hooks.hook).toHaveBeenCalledWith(
        'build:done',
        expect.any(Function),
      );
      expect(mockWxt.hooks.hook).toHaveBeenCalledWith(
        'prepare:publicPaths',
        expect.any(Function),
      );
    });
  });

  describe('error handling', () => {
    it('should warn when disabled', async () => {
      const options: AutoIconsOptions = {
        enabled: false,
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      expect(mockWxt.logger.warn).toHaveBeenCalledWith(
        '`[auto-icons]` @wxt-dev/auto-icons disabled',
      );
      expect(mockWxt.hooks.hook).not.toHaveBeenCalled();
    });

    it('should warn when base icon not found', async () => {
      vi.mocked(fsExtra.exists).mockResolvedValue(false as any);

      const options: AutoIconsOptions = {
        enabled: true,
        baseIconPath: 'assets/missing-icon.png',
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      expect(mockWxt.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Skipping icon generation, no base icon found at',
        ),
      );
      expect(mockWxt.hooks.hook).not.toHaveBeenCalled();
    });
  });

  describe('manifest generation hook', () => {
    it('should update manifest with default icons when no custom sizes provided', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const manifestHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:manifestGenerated')?.[1];

      expect(manifestHook).toBeDefined();

      const manifest: UserManifest = {};
      if (manifestHook) {
        await manifestHook(mockWxt as unknown as Wxt, manifest);
      }

      // Should use default sizes: [128, 48, 32, 16]
      expect(manifest.icons).toEqual({
        128: 'icons/128.png',
        48: 'icons/48.png',
        32: 'icons/32.png',
        16: 'icons/16.png',
      });
    });

    it('should merge custom sizes with defaults', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        sizes: [96, 64], // These will be merged with defaults
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const manifestHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:manifestGenerated')?.[1];

      expect(manifestHook).toBeDefined();

      const manifest: UserManifest = {};
      if (manifestHook) {
        await manifestHook(mockWxt as unknown as Wxt, manifest);
      }

      // defu merges arrays, so we get both custom and default sizes
      expect(manifest.icons).toEqual({
        96: 'icons/96.png',
        64: 'icons/64.png',
        128: 'icons/128.png',
        48: 'icons/48.png',
        32: 'icons/32.png',
        16: 'icons/16.png',
      });
    });

    it('should warn when overwriting existing icons in manifest', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const manifestHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:manifestGenerated')?.[1];

      const manifest: UserManifest = {
        icons: {
          128: 'existing-icon.png',
        },
      };

      if (manifestHook) {
        await manifestHook(mockWxt as unknown as Wxt, manifest);
      }

      expect(mockWxt.logger.warn).toHaveBeenCalledWith(
        '`[auto-icons]` icons property found in manifest, overwriting with auto-generated icons',
      );
    });
  });

  describe('icon generation hook', () => {
    it('should generate icons with default sizes', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
      };

      const output: BuildOutput = {
        publicAssets: [],
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      expect(buildHook).toBeDefined();
      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
      }

      expect(sharp).toHaveBeenCalledWith(
        resolve('/mock/src', 'assets/icon.png'),
      );
      expect(mockSharpInstance.png).toHaveBeenCalled();

      // Should resize to default sizes
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(128);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(48);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(32);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(16);

      expect(fsExtra.ensureDir).toHaveBeenCalledWith(
        resolve('/mock/dist', 'icons'),
      );

      expect(output.publicAssets).toEqual([
        { type: 'asset', fileName: 'icons/128.png' },
        { type: 'asset', fileName: 'icons/48.png' },
        { type: 'asset', fileName: 'icons/32.png' },
        { type: 'asset', fileName: 'icons/16.png' },
      ]);
    });

    it('should generate icons with custom sizes merged with defaults', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        sizes: [96, 64],
      };

      const output: BuildOutput = {
        publicAssets: [],
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      expect(buildHook).toBeDefined();
      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
      }

      // Should include both custom and default sizes
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(96);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(64);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(128);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(48);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(32);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(16);

      expect(output.publicAssets).toEqual([
        { type: 'asset', fileName: 'icons/96.png' },
        { type: 'asset', fileName: 'icons/64.png' },
        { type: 'asset', fileName: 'icons/128.png' },
        { type: 'asset', fileName: 'icons/48.png' },
        { type: 'asset', fileName: 'icons/32.png' },
        { type: 'asset', fileName: 'icons/16.png' },
      ]);
    });

    it('should apply grayscale in development mode', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        grayscaleOnDevelopment: true,
        sizes: [128],
      };

      const output: BuildOutput = { publicAssets: [] };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
      }

      expect(mockSharpInstance.grayscale).toHaveBeenCalled();
    });

    it('should not apply grayscale in production mode', async () => {
      const prodMockWxt = {
        ...mockWxt,
        config: {
          ...mockWxt.config,
          mode: 'production' as const,
        },
      };

      const options: AutoIconsOptions = {
        enabled: true,
        grayscaleOnDevelopment: true,
        sizes: [128],
      };

      const output: BuildOutput = { publicAssets: [] };

      await autoIconsModule.setup!(prodMockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(prodMockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      if (buildHook) {
        await buildHook(prodMockWxt as unknown as Wxt, output);
      }

      expect(mockSharpInstance.grayscale).not.toHaveBeenCalled();
    });

    it('should not apply grayscale when disabled', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        grayscaleOnDevelopment: false,
        sizes: [128],
      };

      const output: BuildOutput = { publicAssets: [] };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
      }

      expect(mockSharpInstance.grayscale).not.toHaveBeenCalled();
    });
  });

  describe('public paths hook', () => {
    it('should add default icon paths to public paths', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const pathsHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'prepare:publicPaths')?.[1];

      expect(pathsHook).toBeDefined();

      const paths: string[] = [];
      if (pathsHook) {
        pathsHook(mockWxt as unknown as Wxt, paths);
      }

      expect(paths).toEqual([
        'icons/128.png',
        'icons/48.png',
        'icons/32.png',
        'icons/16.png',
      ]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty sizes array', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        sizes: [], // Empty array should still merge with defaults
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const manifestHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:manifestGenerated')?.[1];

      const manifest: UserManifest = {};
      if (manifestHook) {
        await manifestHook(mockWxt as unknown as Wxt, manifest);
      }

      // Should still have default sizes due to defu merge
      expect(manifest.icons).toEqual({
        128: 'icons/128.png',
        48: 'icons/48.png',
        32: 'icons/32.png',
        16: 'icons/16.png',
      });
    });

    it('should handle sharp processing errors gracefully', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
      };

      // Make toFile throw an error
      mockSharpInstance.resize = vi.fn().mockImplementation(() => ({
        toFile: vi.fn().mockRejectedValue(new Error('Sharp processing failed')),
      }));

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      const output: BuildOutput = { publicAssets: [] };

      // Should throw the sharp error
      if (buildHook) {
        await expect(
          buildHook(mockWxt as unknown as Wxt, output),
        ).rejects.toThrow('Sharp processing failed');
      }
    });

    it('should handle file system errors during directory creation', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
      };

      // Make ensureDir throw an error
      vi.mocked(fsExtra.ensureDir).mockRejectedValue(
        new Error('Directory creation failed'),
      );

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      const output: BuildOutput = { publicAssets: [] };

      // The module doesn't await ensureDir, so it won't throw
      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
        // But ensureDir should have been called
        expect(fsExtra.ensureDir).toHaveBeenCalled();
      }
    });

    it('should handle custom base icon path correctly', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        baseIconPath: '/absolute/path/to/icon.png',
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      const output: BuildOutput = { publicAssets: [] };

      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
      }

      // Should use the absolute path directly
      expect(sharp).toHaveBeenCalledWith('/absolute/path/to/icon.png');
    });
  });

  describe('integration test', () => {
    it('should handle full workflow correctly', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        baseIconPath: 'assets/custom-icon.png',
        sizes: [96], // Will be merged with defaults
        grayscaleOnDevelopment: false,
      };

      const manifest: UserManifest = {};
      const output: BuildOutput = { publicAssets: [] };
      const paths: string[] = [];

      // Setup the module
      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      // Execute all hooks
      const manifestHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:manifestGenerated')?.[1];
      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];
      const pathsHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'prepare:publicPaths')?.[1];

      if (manifestHook) {
        await manifestHook(mockWxt as unknown as Wxt, manifest);
      }
      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
      }
      if (pathsHook) {
        pathsHook(mockWxt as unknown as Wxt, paths);
      }

      // Verify results - defu merges arrays
      expect(manifest.icons).toEqual({
        96: 'icons/96.png',
        128: 'icons/128.png',
        48: 'icons/48.png',
        32: 'icons/32.png',
        16: 'icons/16.png',
      });

      expect(output.publicAssets).toEqual([
        { type: 'asset', fileName: 'icons/96.png' },
        { type: 'asset', fileName: 'icons/128.png' },
        { type: 'asset', fileName: 'icons/48.png' },
        { type: 'asset', fileName: 'icons/32.png' },
        { type: 'asset', fileName: 'icons/16.png' },
      ]);

      expect(paths).toEqual([
        'icons/96.png',
        'icons/128.png',
        'icons/48.png',
        'icons/32.png',
        'icons/16.png',
      ]);

      expect(sharp).toHaveBeenCalledWith(
        resolve('/mock/src', 'assets/custom-icon.png'),
      );
      expect(mockSharpInstance.grayscale).not.toHaveBeenCalled();
    });
  });
});
