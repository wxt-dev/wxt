import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWebExtRunner } from '../web-ext';
import { setFakeWxt } from '../../utils/testing/fake-objects';
import { isWsl } from '../../utils/wsl';

vi.mock('node:fs/promises', () => ({
  access: vi.fn(async (filePath: string) => {
    if (filePath === '/opt/google/chrome/chrome') return;
    throw new Error('ENOENT');
  }),
  realpath: vi.fn(async (filePath: string) => filePath),
}));

vi.mock('../../utils/wsl');
const isWslMock = vi.mocked(isWsl);

const cmdRun = vi.fn();

vi.mock('web-ext-run', () => ({
  default: {
    cmd: {
      run: cmdRun,
    },
  },
}));

vi.mock('web-ext-run/util/logger', () => ({
  consoleStream: {
    write: vi.fn(),
  },
}));

describe('createWebExtRunner (WSLg)', () => {
  const originalDisplay = process.env.DISPLAY;

  afterEach(() => {
    process.env.DISPLAY = originalDisplay;
    cmdRun.mockReset();
  });

  it('should ignore Windows-style binaries on WSLg so CDP pipes can work', async () => {
    process.env.DISPLAY = ':0';
    isWslMock.mockResolvedValueOnce(true);

    cmdRun.mockResolvedValueOnce({
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

    expect(cmdRun).toHaveBeenCalledTimes(1);
    const finalConfig = cmdRun.mock.calls[0][0] as Record<string, any>;
    expect(finalConfig.chromiumBinary).toBe('/opt/google/chrome/chrome');
  });

  it('should coerce chromiumArgs --user-data-dir into chromiumProfile + keepProfileChanges on WSLg', async () => {
    process.env.DISPLAY = ':0';
    isWslMock.mockResolvedValueOnce(true);

    cmdRun.mockResolvedValueOnce({
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

    expect(cmdRun).toHaveBeenCalledTimes(1);
    const finalConfig = cmdRun.mock.calls[0][0] as Record<string, any>;
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
});
