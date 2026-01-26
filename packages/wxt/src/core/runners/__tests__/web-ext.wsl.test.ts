import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWebExtRunner } from '../web-ext';
import { setFakeWxt } from '../../utils/testing/fake-objects';
import { hasGuiDisplay, isWsl } from '../../utils/wsl';

vi.mock('node:fs/promises', () => ({
  access: vi.fn(async (filePath: string) => {
    if (filePath === '/opt/google/chrome/chrome') return;
    throw new Error('ENOENT');
  }),
  realpath: vi.fn(async (filePath: string) => filePath),
}));

vi.mock('../../utils/wsl');
const isWslMock = vi.mocked(isWsl);
const hasGuiDisplayMock = vi.mocked(hasGuiDisplay);

const cmdRunMock = vi.fn();

vi.mock('web-ext-run', () => ({
  default: {
    cmd: {
      run: cmdRunMock,
    },
  },
}));

vi.mock('web-ext-run/util/logger', () => ({
  consoleStream: {
    write: vi.fn(),
  },
}));

describe('createWebExtRunner (WSL with GUI)', () => {
  const originalDisplay = process.env.DISPLAY;
  const originalWaylandDisplay = process.env.WAYLAND_DISPLAY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DISPLAY = originalDisplay;
    process.env.WAYLAND_DISPLAY = originalWaylandDisplay;
  });

  it('should ignore Windows-style binaries in WSL with GUI so CDP pipes can work', async () => {
    isWslMock.mockResolvedValueOnce(true);
    hasGuiDisplayMock.mockReturnValueOnce(true);

    cmdRunMock.mockResolvedValueOnce({
      exit: vi.fn(),
    });

    setFakeWxt({
      config: {
        browser: 'chrome',
        manifestVersion: 3,
        outDir: '/tmp/wxt-out',
        runnerConfig: {
          config: {
            binaries: {
              chrome:
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            },
          },
        },
      },
    });

    const runner = createWebExtRunner();
    await runner.openBrowser();

    expect(cmdRunMock).toHaveBeenCalledTimes(1);
    expect(cmdRunMock.mock.calls[0]).toBeDefined();
    const finalConfig = cmdRunMock.mock.calls[0][0] as Record<string, any>;
    expect(finalConfig.chromiumBinary).toBe('/opt/google/chrome/chrome');
  });

  it('should coerce chromiumArgs --user-data-dir into chromiumProfile + keepProfileChanges in WSL with GUI', async () => {
    isWslMock.mockResolvedValueOnce(true);
    hasGuiDisplayMock.mockReturnValueOnce(true);

    cmdRunMock.mockResolvedValueOnce({
      exit: vi.fn(),
    });

    setFakeWxt({
      config: {
        root: '/home/user/project',
        browser: 'chrome',
        manifestVersion: 3,
        outDir: '/tmp/wxt-out',
        runnerConfig: {
          config: {
            chromiumArgs: [
              '--user-data-dir=./.wxt/chrome-data',
              '--some-other-flag',
            ],
          },
        },
      },
    });

    const runner = createWebExtRunner();
    await runner.openBrowser();

    expect(cmdRunMock).toHaveBeenCalledTimes(1);
    expect(cmdRunMock.mock.calls[0]).toBeDefined();
    const finalConfig = cmdRunMock.mock.calls[0][0] as Record<string, any>;
    expect(finalConfig.chromiumProfile).toBe(
      '/home/user/project/.wxt/chrome-data',
    );
    expect(finalConfig.keepProfileChanges).toBe(true);
    expect(finalConfig.args).toEqual(
      expect.arrayContaining([
        '--unsafely-disable-devtools-self-xss-warnings',
        '--some-other-flag',
      ]),
    );
    expect(finalConfig.args).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/--user-data-dir/)]),
    );
  });

  it('should not apply WSL with GUI workarounds when not running in WSL', async () => {
    isWslMock.mockResolvedValueOnce(false);
    hasGuiDisplayMock.mockReturnValueOnce(true);

    cmdRunMock.mockResolvedValueOnce({
      exit: vi.fn(),
    });

    setFakeWxt({
      config: {
        browser: 'chrome',
        manifestVersion: 3,
        outDir: '/tmp/wxt-out',
        runnerConfig: {
          config: {
            binaries: {
              chrome:
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            },
          },
        },
      },
    });

    const runner = createWebExtRunner();
    await runner.openBrowser();

    expect(cmdRunMock).toHaveBeenCalledTimes(1);
    expect(cmdRunMock.mock.calls[0]).toBeDefined();
    const finalConfig = cmdRunMock.mock.calls[0][0] as Record<string, any>;
    // Windows binary should be preserved when not in WSL
    expect(finalConfig.chromiumBinary).toBe(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    );
  });

  it('should not apply WSL with GUI workarounds when no GUI is available', async () => {
    isWslMock.mockResolvedValueOnce(true);
    hasGuiDisplayMock.mockReturnValueOnce(false);

    cmdRunMock.mockResolvedValueOnce({
      exit: vi.fn(),
    });

    setFakeWxt({
      config: {
        browser: 'chrome',
        manifestVersion: 3,
        outDir: '/tmp/wxt-out',
        runnerConfig: {
          config: {
            binaries: {
              chrome:
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            },
          },
        },
      },
    });

    const runner = createWebExtRunner();
    await runner.openBrowser();

    expect(cmdRunMock).toHaveBeenCalledTimes(1);
    expect(cmdRunMock.mock.calls[0]).toBeDefined();
    const finalConfig = cmdRunMock.mock.calls[0][0] as Record<string, any>;
    // Windows binary should be preserved when no GUI is available
    expect(finalConfig.chromiumBinary).toBe(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    );
  });

  it('should apply workarounds when WAYLAND_DISPLAY is set in WSL', async () => {
    isWslMock.mockResolvedValueOnce(true);
    hasGuiDisplayMock.mockReturnValueOnce(true);

    cmdRunMock.mockResolvedValueOnce({
      exit: vi.fn(),
    });

    setFakeWxt({
      config: {
        browser: 'chrome',
        manifestVersion: 3,
        outDir: '/tmp/wxt-out',
        runnerConfig: {
          config: {
            binaries: {
              chrome:
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            },
          },
        },
      },
    });

    const runner = createWebExtRunner();
    await runner.openBrowser();

    expect(cmdRunMock).toHaveBeenCalledTimes(1);
    expect(cmdRunMock.mock.calls[0]).toBeDefined();
    const finalConfig = cmdRunMock.mock.calls[0][0] as Record<string, any>;
    // Windows binary should be ignored, Linux binary used instead
    expect(finalConfig.chromiumBinary).toBe('/opt/google/chrome/chrome');
  });
});
