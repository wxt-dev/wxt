import { beforeEach, describe, expect, it, vi } from 'vitest';
import webExt from 'web-ext';
import { setFakeWxt } from '../../utils/testing/fake-objects';
import { createWebExtRunner } from '../web-ext';

vi.mock('web-ext', () => ({
  default: {
    cmd: {
      run: vi.fn().mockResolvedValue({ exit: vi.fn() }),
    },
  },
}));
vi.mock('web-ext/util/logger', () => ({ consoleStream: {} }));

describe('createWebExtRunner', () => {
  beforeEach(() => {
    setFakeWxt({
      config: {
        browser: 'chrome',
        outDir: '/root/.output/chrome-mv3',
        webExt: {
          config: {
            chromiumProfile: '/root/.wxt/chrome-data',
            keepProfileChanges: true,
          },
        },
      },
    });
  });

  it('creates a missing custom Chromium profile before launching', async () => {
    await createWebExtRunner().openBrowser();

    expect(webExt.cmd.run).toHaveBeenCalledWith(
      expect.objectContaining({
        chromiumProfile: '/root/.wxt/chrome-data',
        profileCreateIfMissing: true,
      }),
      { shouldExitProgram: false },
    );
  });
});
