import { beforeEach, describe, expect, it, vi } from 'vitest';
import webExt, { WebExtRunInstance } from 'web-ext';
import logger from 'web-ext/util/logger';
import { WebExtRunner } from '../web-ext';
import { setFakeWxt } from '../../../internal-utils/testing/fake-objects';
import { mock, MockProxy } from 'vitest-mock-extended';
import { WebExtConfig } from '../../../types';
import {
  createWslChromiumProfile,
  findLinuxChromium,
  hasDisplay,
  isUnusableSnap,
  which,
  WslChromiumProfile,
} from '../../../internal-utils/wsl-utils';

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

vi.mock('../../../internal-utils/wsl-utils', () => ({
  createWslChromiumProfile: vi.fn(),
  findLinuxChromium: vi.fn(),
  hasDisplay: vi.fn(),
  isUnusableSnap: vi.fn(),
  which: vi.fn(),
}));
const createWslChromiumProfileMock = vi.mocked(createWslChromiumProfile);
const findLinuxChromiumMock = vi.mocked(findLinuxChromium);
const hasDisplayMock = vi.mocked(hasDisplay);
const isUnusableSnapMock = vi.mocked(isUnusableSnap);
const whichMock = vi.mocked(which);

describe('WebExtRunner', () => {
  function setupRunner(config = setupWxt().config) {
    return new WebExtRunner(webExt, logger, config);
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
      let profile: MockProxy<WslChromiumProfile>;

      function runConfig() {
        expect(webExtCmdRunMock).toHaveBeenCalledTimes(1);
        return webExtCmdRunMock.mock.calls[0][0] as Record<string, any>;
      }

      beforeEach(() => {
        isWsl = true;
        profile = mock<WslChromiumProfile>({
          chromiumProfile: '/tmp/wxt-chromium-profile-abc',
          args: ['--user-data-dir=/tmp/wxt-chromium-profile-abc'],
        });
        createWslChromiumProfileMock.mockResolvedValue(profile);
        findLinuxChromiumMock.mockResolvedValue('/usr/bin/google-chrome');
        hasDisplayMock.mockReturnValue(true);
        isUnusableSnapMock.mockResolvedValue(false);
        whichMock.mockResolvedValue('/usr/bin/firefox');
      });

      describe.each(['chrome', 'firefox'])(
        'when there is no display for %s',
        (browser) => {
          it('should warn and do nothing', async () => {
            targetBrowser = browser;
            hasDisplayMock.mockReturnValue(false);
            const { config } = setupWxt();

            await setupRunner(config).openBrowser();

            expectNothing();
            expect(findLinuxChromiumMock).not.toHaveBeenCalled();
            expect(config.logger.warn).toHaveBeenCalledWith(
              expect.stringContaining('without a display'),
            );
          });
        },
      );

      describe('when targeting Chromium', () => {
        it('should open the Linux Chromium with its own profile', async () => {
          await openBrowser();

          expect(findLinuxChromiumMock).toHaveBeenCalledWith(undefined);
          expect(createWslChromiumProfileMock).toHaveBeenCalledWith(undefined);
          expect(runConfig()).toMatchObject({
            chromiumBinary: '/usr/bin/google-chrome',
            chromiumProfile: '/tmp/wxt-chromium-profile-abc',
            keepProfileChanges: true,
            args: [
              '--unsafely-disable-devtools-self-xss-warnings',
              '--user-data-dir=/tmp/wxt-chromium-profile-abc',
            ],
          });
        });

        it('should pass the configured binary to findLinuxChromium', async () => {
          webExtConfig = { binaries: { chrome: '/opt/chrome/chrome' } };

          await openBrowser();

          expect(findLinuxChromiumMock).toHaveBeenCalledWith(
            '/opt/chrome/chrome',
          );
        });

        it("should keep the user's --user-data-dir", async () => {
          webExtConfig = {
            chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
          };

          await openBrowser();

          expect(createWslChromiumProfileMock).not.toHaveBeenCalled();
          expect(runConfig().args).toEqual([
            '--unsafely-disable-devtools-self-xss-warnings',
            '--user-data-dir=./.wxt/chrome-data',
          ]);
        });

        it('should reuse a kept chromiumProfile', async () => {
          webExtConfig = {
            chromiumProfile: '/home/user/chrome',
            keepProfileChanges: true,
          };

          await openBrowser();

          expect(createWslChromiumProfileMock).toHaveBeenCalledWith(
            '/home/user/chrome',
          );
        });

        it('should warn that a chromiumProfile web-ext copies is ignored', async () => {
          webExtConfig = { chromiumProfile: '/home/user/chrome' };
          const { config } = setupWxt();

          await setupRunner(config).openBrowser();

          expect(createWslChromiumProfileMock).not.toHaveBeenCalled();
          expect(config.logger.warnOnce).toHaveBeenCalledWith(
            expect.stringContaining('`chromiumProfile` is ignored'),
          );
          expect(runConfig().chromiumProfile).toBe('/home/user/chrome');
        });

        it('should warn and do nothing without a Linux Chromium', async () => {
          findLinuxChromiumMock.mockResolvedValue(undefined);
          const { config } = setupWxt();

          await setupRunner(config).openBrowser();

          expectNothing();
          expect(createWslChromiumProfileMock).not.toHaveBeenCalled();
          expect(config.logger.warn).toHaveBeenCalledWith(
            expect.stringContaining(
              'Cannot find a Chromium browser installed inside WSL',
            ),
          );
        });

        it('should warn and do nothing for a Snap Chromium', async () => {
          isUnusableSnapMock.mockResolvedValue(true);
          const { config } = setupWxt();

          await setupRunner(config).openBrowser();

          expectNothing();
          expect(isUnusableSnapMock).toHaveBeenCalledWith(
            '/usr/bin/google-chrome',
          );
          expect(config.logger.warn).toHaveBeenCalledWith(
            expect.stringContaining(
              'Cannot open the Snap version of Chromium when using WSL',
            ),
          );
        });

        it('should clean up the profile when opening the browser fails', async () => {
          webExtCmdRunMock.mockRejectedValueOnce(Error('test'));

          await expect(openBrowser()).rejects.toThrow('test');

          expect(profile.cleanup).toHaveBeenCalledTimes(1);
        });

        it('should clean up the profile when closing the browser', async () => {
          webExtCmdRunMock.mockResolvedValueOnce(mock<WebExtRunInstance>());
          const runner = setupRunner();

          await runner.openBrowser();
          await runner.closeBrowser();
          await runner.closeBrowser();

          expect(profile.cleanup).toHaveBeenCalledTimes(1);
        });
      });

      describe('when targeting Firefox', () => {
        beforeEach(() => {
          targetBrowser = 'firefox';
        });

        it('should open the browser', async () => {
          await openBrowser();

          expect(webExtCmdRunMock).toHaveBeenCalledTimes(1);
          expect(createWslChromiumProfileMock).not.toHaveBeenCalled();
        });

        it('should check the configured binary for Snap', async () => {
          webExtConfig = { binaries: { firefox: '/opt/firefox/firefox' } };

          await openBrowser();

          expect(whichMock).not.toHaveBeenCalled();
          expect(isUnusableSnapMock).toHaveBeenCalledWith(
            '/opt/firefox/firefox',
          );
        });

        it('should warn and do nothing for a Snap Firefox', async () => {
          isUnusableSnapMock.mockResolvedValue(true);
          const { config } = setupWxt();

          await setupRunner(config).openBrowser();

          expectNothing();
          expect(isUnusableSnapMock).toHaveBeenCalledWith('/usr/bin/firefox');
          expect(config.logger.warn).toHaveBeenCalledWith(
            expect.stringContaining(
              'Cannot open the Snap version of Firefox when using WSL',
            ),
          );
        });
      });

      describe('when webExt.disabled=true', () => {
        it('should not look for a browser', async () => {
          webExtConfig = { disabled: true };

          await openBrowser();

          expectNothing();
          expect(findLinuxChromiumMock).not.toHaveBeenCalled();
          expect(createWslChromiumProfileMock).not.toHaveBeenCalled();
        });
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
