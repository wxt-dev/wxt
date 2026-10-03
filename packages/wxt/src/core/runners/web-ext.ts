import type { WebExtRunInstance } from 'web-ext';
import { ExtensionRunner } from '../../types';
import { formatDuration } from '../utils/time';
import defu from 'defu';
import { wxt } from '../wxt';
import webExt from 'web-ext';
import { consoleStream } from 'web-ext/util/logger';

/** Create an `ExtensionRunner` backed by `web-ext`. */
export function createWebExtRunner(): ExtensionRunner {
  let runner: WebExtRunInstance | undefined;

  return {
    canOpen() {
      return true;
    },
    async openBrowser() {
      const startTime = Date.now();

      // Use WXT's logger instead of web-ext's built-in one.
      consoleStream.write = ({ level, msg, name }) => {
        if (level >= ERROR_LOG_LEVEL) wxt.logger.error(name, msg);
        if (level >= WARN_LOG_LEVEL) wxt.logger.warn(msg);
      };

      const wxtUserConfig = wxt.config.webExt.config;
      const target =
        wxtUserConfig?.target ??
        (wxt.config.browser === 'firefox' ? 'firefox-desktop' : 'chromium');

      // Options for known targets, anything else passes through to web-ext as-is
      let targetConfig: Record<string, unknown> = {};
      if (target === 'firefox-desktop') {
        targetConfig = {
          firefox: wxtUserConfig?.binaries?.firefox,
          firefoxProfile: wxtUserConfig?.firefoxProfile,
          pref: wxtUserConfig?.firefoxPref,
          args: wxtUserConfig?.firefoxArgs,
        };
      } else if (target === 'firefox-android') {
        targetConfig = {
          adbDevice: wxtUserConfig?.adbDevice,
          adbBin: wxtUserConfig?.adbBin,
          firefoxApk: wxtUserConfig?.firefoxApk ?? 'org.mozilla.fenix',
          pref: wxtUserConfig?.firefoxPref,
        };
      } else if (target === 'chromium') {
        targetConfig = {
          chromiumBinary: wxtUserConfig?.binaries?.[wxt.config.browser],
          chromiumProfile: wxtUserConfig?.chromiumProfile,
          chromiumPref: defu(
            wxtUserConfig?.chromiumPref,
            DEFAULT_CHROMIUM_PREFS,
          ),
          args: [
            '--unsafely-disable-devtools-self-xss-warnings',
            ...(wxtUserConfig?.chromiumArgs ?? []),
          ],
        };
      }

      const userConfig = {
        browserConsole: wxtUserConfig?.openConsole,
        devtools: wxtUserConfig?.openDevtools,
        startUrl: wxtUserConfig?.startUrls,
        keepProfileChanges: wxtUserConfig?.keepProfileChanges,
        chromiumPort: wxtUserConfig?.chromiumPort,
        ...targetConfig,
      };

      const finalConfig = {
        ...userConfig,
        target,
        sourceDir: wxt.config.outDir,
        // Don't add a "Reload Manager" extension alongside dev extension, WXT
        // already handles reloads internally.
        noReloadManagerExtension: true,
        // WXT handles reloads, except on Android where web-ext must re-push
        noReload: target !== 'firefox-android',
        noInput: true,
      };
      const options = {
        // Don't call `process.exit(0)` after starting web-ext
        shouldExitProgram: false,
      };
      wxt.logger.debug('web-ext config:', finalConfig);
      wxt.logger.debug('web-ext options:', options);

      runner = await webExt.cmd.run(finalConfig, options);

      const duration = Date.now() - startTime;
      wxt.logger.success(`Opened browser in ${formatDuration(duration)}`);
    },

    async closeBrowser() {
      await runner?.exit();
    },
  };
}

// https://github.com/mozilla/web-ext/blob/e37e60a2738478f512f1255c537133321f301771/src/util/logger.js#L12
const WARN_LOG_LEVEL = 40;
const ERROR_LOG_LEVEL = 50;

const DEFAULT_CHROMIUM_PREFS = {
  devtools: {
    synced_preferences_sync_disabled: {
      // Remove content scripts from sourcemap debugger ignore list so stack traces
      // and log locations show up properly, see:
      // https://github.com/wxt-dev/wxt/issues/236#issuecomment-1915364520
      skipContentScripts: false,
      // Was renamed at some point, see:
      // https://github.com/wxt-dev/wxt/issues/912#issuecomment-2284288171
      'skip-content-scripts': false,
    },
  },
};
