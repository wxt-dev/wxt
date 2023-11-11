import type { WebExtRunInstance } from 'web-ext-run';
import { ExtensionRunner } from '~/types';

/**
 * Create an `ExtensionRunner` backed by `web-ext`.
 */
export function createWebExtRunner(): ExtensionRunner {
  let runner: WebExtRunInstance | undefined;

  return {
    async openBrowser(config) {
      config.logger.info('Opening browser...');

      if (config.browser === 'firefox' && config.manifestVersion === 3) {
        throw Error(
          'Dev mode does not support Firefox MV3. For alternatives, see https://github.com/wxt-dev/wxt/issues/230#issuecomment-1806881653',
        );
      }

      // Use the plugin's logger instead of web-ext's built-in one.
      const webExtLogger = await import('web-ext-run/util/logger');
      webExtLogger.consoleStream.write = ({ level, msg, name }) => {
        if (level >= ERROR_LOG_LEVEL) config.logger.error(name, msg);
        if (level >= WARN_LOG_LEVEL) config.logger.warn(msg);
      };

      const wxtUserConfig = config.runnerConfig.config;
      const userConfig = {
        console: wxtUserConfig?.openConsole,
        devtools: wxtUserConfig?.openDevtools,
        startUrl: wxtUserConfig?.startUrls,
        ...(config.browser === 'firefox'
          ? {
              firefox: wxtUserConfig?.binaries?.firefox,
              firefoxProfile: wxtUserConfig?.firefoxProfile,
              prefs: wxtUserConfig?.firefoxPrefs,
              args: wxtUserConfig?.firefoxArgs,
            }
          : {
              chromiumBinary: wxtUserConfig?.binaries?.[config.browser],
              chromiumProfile: wxtUserConfig?.chromiumProfile,
              args: wxtUserConfig?.chromiumArgs,
            }),
      };

      const finalConfig = {
        ...userConfig,
        target: config.browser === 'firefox' ? 'firefox-desktop' : 'chromium',
        sourceDir: config.outDir,
        // WXT handles reloads, so disable auto-reload behaviors in web-ext
        noReload: true,
        noInput: true,
      };
      const options = {
        // Don't call `process.exit(0)` after starting web-ext
        shouldExitProgram: false,
      };
      config.logger.debug('web-ext config:', finalConfig);
      config.logger.debug('web-ext options:', options);

      const webExt = await import('web-ext-run');
      runner = await webExt.default.cmd.run(finalConfig, options);

      config.logger.success('Opened!');
    },

    async closeBrowser() {
      return await runner?.exit();
    },
  };
}

// https://github.com/mozilla/web-ext/blob/e37e60a2738478f512f1255c537133321f301771/src/util/logger.js#L12
const WARN_LOG_LEVEL = 40;
const ERROR_LOG_LEVEL = 50;
