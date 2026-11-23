import { afterEach, describe, expect, it, vi } from 'vitest';

import safariModule, {
  type SafariModuleWxt,
  type SafariOptions,
} from '../index';

function createMockWxt(overrides: Partial<SafariModuleWxt['config']> = {}): {
  wxt: SafariModuleWxt;
  hooks: Map<string, (wxt: SafariModuleWxt) => Promise<void> | void>;
} {
  const hooks = new Map<
    string,
    (wxt: SafariModuleWxt) => Promise<void> | void
  >();
  const wxt: SafariModuleWxt = {
    config: {
      browser: 'safari',
      command: 'build',
      root: '/tmp/test-ext',
      outBaseDir: '/tmp/test-ext/.output',
      outDir: '/tmp/test-ext/.output/safari-mv2',
      manifestVersion: 2,
      manifest: {
        name: 'Test Extension',
        version: '1.0.0',
      },
      ...overrides,
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
    },
    hooks: {
      hook: vi.fn((name, fn) => {
        hooks.set(name, fn);
      }),
    },
  };
  return { wxt, hooks };
}

const validOptions: SafariOptions = {
  appCategory: 'public.app-category.productivity',
  bundleIdentifier: 'com.example.test-ext',
};

describe('safariModule.setup', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('skips when browser is not safari', async () => {
    const { wxt } = createMockWxt({ browser: 'chrome' });
    await safariModule.setup(wxt, validOptions);
    expect(wxt.hooks.hook).not.toHaveBeenCalled();
  });

  it('skips when command is not build', async () => {
    const { wxt } = createMockWxt({ command: 'serve' });
    await safariModule.setup(wxt, validOptions);
    expect(wxt.hooks.hook).not.toHaveBeenCalled();
  });

  it('skips when options are omitted', async () => {
    const { wxt } = createMockWxt();
    await safariModule.setup(wxt, undefined);
    expect(wxt.hooks.hook).not.toHaveBeenCalled();
  });

  it('warns and skips when appCategory or bundleIdentifier is missing', async () => {
    const { wxt: wxt1 } = createMockWxt();
    await safariModule.setup(wxt1, {
      appCategory: '',
      bundleIdentifier: 'com.example.test-ext',
    });
    expect(wxt1.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('appCategory and bundleIdentifier'),
    );
    expect(wxt1.hooks.hook).not.toHaveBeenCalled();

    const { wxt: wxt2 } = createMockWxt();
    await safariModule.setup(wxt2, {
      appCategory: 'public.app-category.productivity',
      bundleIdentifier: '',
    });
    expect(wxt2.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('appCategory and bundleIdentifier'),
    );
    expect(wxt2.hooks.hook).not.toHaveBeenCalled();
  });

  it('throws on non-darwin inside build:done', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true,
    });
    const { wxt, hooks } = createMockWxt();
    await safariModule.setup(wxt, validOptions);

    const buildDone = hooks.get('build:done');
    expect(buildDone).toBeTypeOf('function');
    await expect(buildDone!(wxt)).rejects.toThrow(
      'Safari Xcode conversion is only supported on macOS.',
    );
    expect(wxt.logger.error).not.toHaveBeenCalled();
  });
});
