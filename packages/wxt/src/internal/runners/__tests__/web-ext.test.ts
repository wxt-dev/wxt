import { beforeEach, describe, expect, it, vi } from 'vitest';
import webExt, { WebExtRunInstance } from 'web-ext';
import logger from 'web-ext/util/logger';
import { WebExtRunner } from '../web-ext';
import { setFakeWxt } from '../../../internal-utils/testing/fake-objects';
import { mock, MockProxy } from 'vitest-mock-extended';
import { WebExtConfig } from '../../../types';

const DEFAULT_IS_WSL = false;
const DEFAULT_TARGET_BROWSER = 'chrome';
const DEFAULT_WEB_EXT_CONFIG = undefined;

let isWsl = DEFAULT_IS_WSL;
let targetBrowser = DEFAULT_TARGET_BROWSER;
let webExtConfig: WebExtConfig | undefined = DEFAULT_WEB_EXT_CONFIG;

vi.mock('is-wsl', () => ({
  get default() {
    return isWsl;
  },
}));

vi.mock('web-ext', () => ({
  default: {
    cmd: {
      run: vi.fn(),
    },
  },
}));
const webExtCmdRunMock = vi.mocked(webExt.cmd.run);

vi.mock('web-ext/util/logger', () => ({
  default: {
    consoleStream: {},
  },
}));

describe('WebExtRunner', () => {
  function setupRunner() {
    return new WebExtRunner(webExt, logger, setupWxt().config);
  }

  function setupWxt() {
    return setFakeWxt({
      config: {
        browser: targetBrowser,
        webExt: {
          config: webExtConfig,
        },
      },
    });
  }

  beforeEach(() => {
    isWsl = DEFAULT_IS_WSL;
    targetBrowser = DEFAULT_TARGET_BROWSER;
    webExtConfig = DEFAULT_WEB_EXT_CONFIG;
  });

  describe('canOpen', () => {
    async function canOpen() {
      const runner = setupRunner();
      return await runner.canOpen();
    }

    it('should return true', async () => {
      expect(await canOpen()).toBe(true);
    });
  });

  describe('openBrowser', () => {
    async function openBrowser() {
      const runner = setupRunner();
      await runner.openBrowser();
    }
    function expectNothing() {
      expect(webExtCmdRunMock).not.toHaveBeenCalled();
    }

    describe('when in WSL', () => {
      beforeEach(() => {
        isWsl = true;
      });

      it('should do nothing', async () => {
        await openBrowser();
        expectNothing();
      });
    });

    describe('when targeting Safari', () => {
      beforeEach(() => {
        targetBrowser = 'safari';
      });

      it('should do nothing', async () => {
        await openBrowser();
        expectNothing();
      });
    });

    describe('when webExt.disabled=true', () => {
      beforeEach(() => {
        webExtConfig = { disabled: true };
      });

      it('should do nothing', async () => {
        await openBrowser();
        expectNothing();
      });
    });

    it('should open the browser', async () => {
      await openBrowser();
      expect(webExtCmdRunMock).toHaveBeenCalledTimes(1);
    });

    it('should merge the config sources correctly', async () => {
      webExtConfig = {
        startUrls: ['http://example.com'],
      };
      await openBrowser();

      expect(webExtCmdRunMock).toHaveBeenCalledTimes(1);
      expect(webExtCmdRunMock).toHaveBeenCalledWith(
        {
          args: ['--unsafely-disable-devtools-self-xss-warnings'],
          chromiumPref: {
            devtools: {
              synced_preferences_sync_disabled: {
                'skip-content-scripts': false,
                skipContentScripts: false,
              },
            },
          },
          noInput: true,
          noReload: true,
          noReloadManagerExtension: true,
          sourceDir: expect.any(String),
          startUrl: ['http://example.com'],
          target: 'chromium',
        },
        {
          shouldExitProgram: false,
        },
      );
    });
  });

  describe('closeBrowser', () => {
    async function closeBrowser(runner: WebExtRunner = setupRunner()) {
      await runner.closeBrowser();
    }
    let instance: MockProxy<WebExtRunInstance>;

    beforeEach(() => {
      instance = mock<WebExtRunInstance>();
      webExtCmdRunMock.mockResolvedValueOnce(instance);
    });

    describe("when openBrowser hasn't been called", () => {
      it('should do nothing', async () => {
        await closeBrowser();
        expect(webExtCmdRunMock).not.toHaveBeenCalled();
      });
    });

    it('should close the browser', async () => {
      const runner = setupRunner();

      await runner.openBrowser();
      await closeBrowser(runner);

      expect(instance.exit).toHaveBeenCalledTimes(1);
    });
  });
});
