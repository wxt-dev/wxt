import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { resolve } from 'node:path';
import { access, mkdir } from 'node:fs/promises';
import sharp, { type Sharp } from 'sharp';
import type { Wxt, UserManifest } from 'wxt';
import autoIconsModule, { type AutoIconsOptions } from '../index';

vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
}));
const accessMock = vi.mocked(access);
const mkdirMock = vi.mocked(mkdir);

vi.mock('sharp', () => ({
  default: vi.fn(),
}));
const sharpMock = vi.mocked(sharp);

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
    sharpMock.mockReturnValue(mockSharpInstance as unknown as Sharp);
    accessMock.mockResolvedValue(undefined);
    mkdirMock.mockResolvedValue(undefined as any);
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
      accessMock.mockRejectedValue(new Error('ENOENT'));

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

    it('should replace default sizes with custom sizes', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        sizes: [96, 64],
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

      expect(manifest.icons).toEqual({
        96: 'icons/96.png',
        64: 'icons/64.png',
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

    it('should not duplicate icon entries in manifest when sizes overlap defaults', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        sizes: [16, 32, 48, 96, 128],
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const manifestHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:manifestGenerated')?.[1];

      const manifest: UserManifest = {};
      if (manifestHook) {
        await manifestHook(mockWxt as unknown as Wxt, manifest);
      }

      expect(Object.keys(manifest.icons ?? {})).toHaveLength(5);
      expect(manifest.icons).toEqual({
        16: 'icons/16.png',
        32: 'icons/32.png',
        48: 'icons/48.png',
        96: 'icons/96.png',
        128: 'icons/128.png',
      });
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

      expect(mkdirMock).toHaveBeenCalledWith(resolve('/mock/dist', 'icons'), {
        recursive: true,
      });

      expect(output.publicAssets).toEqual([
        { type: 'asset', fileName: 'icons/128.png' },
        { type: 'asset', fileName: 'icons/48.png' },
        { type: 'asset', fileName: 'icons/32.png' },
        { type: 'asset', fileName: 'icons/16.png' },
      ]);
    });

    it('should generate only custom sizes', async () => {
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

      expect(mockSharpInstance.resize).toHaveBeenCalledTimes(2);
      expect(mockSharpInstance.resize).toHaveBeenNthCalledWith(1, 96);
      expect(mockSharpInstance.resize).toHaveBeenNthCalledWith(2, 64);
      expect(mockSharpInstance.toFile).toHaveBeenCalledTimes(2);

      expect(output.publicAssets).toEqual([
        { type: 'asset', fileName: 'icons/96.png' },
        { type: 'asset', fileName: 'icons/64.png' },
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

    it('should deduplicate repeated custom sizes', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
        sizes: [16, 32, 48, 96, 128, 96, 16],
      };

      const output: BuildOutput = { publicAssets: [] };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
      }

      // Each size should only be resized/written once
      expect(mockSharpInstance.resize).toHaveBeenCalledTimes(5);
      expect(output.publicAssets).toEqual([
        { type: 'asset', fileName: 'icons/16.png' },
        { type: 'asset', fileName: 'icons/32.png' },
        { type: 'asset', fileName: 'icons/48.png' },
        { type: 'asset', fileName: 'icons/96.png' },
        { type: 'asset', fileName: 'icons/128.png' },
      ]);
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
        sizes: [],
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const manifestHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:manifestGenerated')?.[1];

      const manifest: UserManifest = {};
      if (manifestHook) {
        await manifestHook(mockWxt as unknown as Wxt, manifest);
      }

      expect(manifest.icons).toEqual({});
    });

    it('should handle sharp processing errors gracefully', async () => {
      const options: AutoIconsOptions = {
        enabled: true,
      };

      // Make toFile throw an error - need to properly chain resize -> png -> toFile
      const errorInstance = {
        toFile: vi.fn().mockRejectedValue(new Error('Sharp processing failed')),
        grayscale: vi.fn(),
        composite: vi.fn(),
      };
      errorInstance.grayscale.mockReturnValue(errorInstance);
      errorInstance.composite.mockReturnValue(errorInstance);

      mockSharpInstance.resize = vi.fn().mockImplementation(() => ({
        png: vi.fn().mockReturnValue(errorInstance),
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
      mkdirMock.mockRejectedValue(new Error('Directory creation failed'));

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      const output: BuildOutput = { publicAssets: [] };

      // The module doesn't await ensureDir, so it won't throw
      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
        // But ensureDir should have been called
        expect(mkdirMock).toHaveBeenCalled();
      }
    });

    it('should handle custom base icon path correctly', async () => {
      const customPath = 'custom/icon.png';
      const options: AutoIconsOptions = {
        enabled: true,
        baseIconPath: customPath,
      };

      await autoIconsModule.setup!(mockWxt as unknown as Wxt, options);

      const buildHook = vi
        .mocked(mockWxt.hooks.hook)
        .mock.calls.find((call) => call[0] === 'build:done')?.[1];

      const output: BuildOutput = { publicAssets: [] };

      if (buildHook) {
        await buildHook(mockWxt as unknown as Wxt, output);
      }

      // Should resolve the path relative to srcDir
      expect(sharp).toHaveBeenCalledWith(resolve('/mock/src', customPath));
    });
  });

  describe('integration test', () => {
    it.each<{ name: string; options: AutoIconsOptions; expected: number[] }>([
      {
        name: 'omitted sizes',
        options: {},
        expected: [128, 48, 32, 16],
      },
      {
        name: 'undefined sizes',
        options: { sizes: undefined },
        expected: [128, 48, 32, 16],
      },
      {
        name: 'one custom size',
        options: { sizes: [96] },
        expected: [96],
      },
      {
        name: 'a subset of default sizes',
        options: { sizes: [32] },
        expected: [32],
      },
      {
        name: 'overlapping custom and default sizes',
        options: { sizes: [16, 32, 48, 96, 128] },
        expected: [16, 32, 48, 96, 128],
      },
      {
        name: 'duplicate custom sizes',
        options: { sizes: [96, 96, 32] },
        expected: [96, 32],
      },
      {
        name: 'empty sizes',
        options: { sizes: [] },
        expected: [],
      },
    ])(
      'should use $name consistently across all hooks',
      async ({ options, expected }) => {
        const customSizesBefore = options.sizes?.slice();
        const manifest: UserManifest = {};
        const output: BuildOutput = { publicAssets: [] };
        const paths: string[] = [];

        await autoIconsModule.setup!(mockWxt as unknown as Wxt, {
          enabled: true,
          baseIconPath: 'assets/custom-icon.png',
          developmentIndicator: false,
          ...options,
        });

        const manifestHook = mockWxt.hooks.hook.mock.calls.find(
          (call) => call[0] === 'build:manifestGenerated',
        )?.[1];
        const buildHook = mockWxt.hooks.hook.mock.calls.find(
          (call) => call[0] === 'build:done',
        )?.[1];
        const pathsHook = mockWxt.hooks.hook.mock.calls.find(
          (call) => call[0] === 'prepare:publicPaths',
        )?.[1];

        expect(manifestHook).toBeTypeOf('function');
        expect(buildHook).toBeTypeOf('function');
        expect(pathsHook).toBeTypeOf('function');

        await manifestHook(mockWxt as unknown as Wxt, manifest);
        await buildHook(mockWxt as unknown as Wxt, output);
        pathsHook(mockWxt as unknown as Wxt, paths);

        const expectedPaths = expected.map((size) => `icons/${size}.png`);
        expect(manifest.icons).toEqual(
          Object.fromEntries(
            expected.map((size) => [size, `icons/${size}.png`]),
          ),
        );
        expect(output.publicAssets).toEqual(
          expectedPaths.map((fileName) => ({ type: 'asset', fileName })),
        );
        expect(paths).toEqual(expectedPaths);
        expect(sharpMock).toHaveBeenCalledTimes(expected.length);
        expect(mockSharpInstance.resize.mock.calls).toEqual(
          expected.map((size) => [size]),
        );
        expect(mockSharpInstance.toFile.mock.calls).toEqual(
          expectedPaths.map((path) => [resolve('/mock/dist', path)]),
        );
        if (expected.length > 0) {
          expect(sharpMock).toHaveBeenCalledWith(
            resolve('/mock/src', 'assets/custom-icon.png'),
          );
        }
        expect(mockSharpInstance.grayscale).not.toHaveBeenCalled();
        expect(options.sizes).toEqual(customSizesBefore);
      },
    );
  });
});
