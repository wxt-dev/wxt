import type { WebExtRunInstance } from 'web-ext';
import { ExtensionRunner } from './ExtensionRunner';

/**
 * Create an `ExtensionRunner` backed by `web-ext`.
 */
export function createWebExtRunner(): ExtensionRunner {
  let runner: WebExtRunInstance | undefined;

  return {
    async openBrowser(config) {
      if (config.browser === 'safari') {
        config.logger.warn('Cannot open safari automatically.');
        return;
      }

      // Use the plugin's logger instead of web-ext's built-in one.
      const webExtLogger = await import('web-ext/util/logger');
      webExtLogger.consoleStream.write = ({ level, msg, name }) => {
        if (level >= ERROR_LOG_LEVEL) config.logger.error(name, msg);
        if (level >= WARN_LOG_LEVEL) config.logger.warn(msg);
      };

      const runnerConfig = config.runnerConfig.config;
      const userConfig = {
        console: runnerConfig?.openConsole,
        devtools: runnerConfig?.openDevtools,
        startUrl: runnerConfig?.startUrls,
        ...(config.browser === 'firefox'
          ? {
              firefox: runnerConfig?.binaries?.firefox,
              firefoxProfile: runnerConfig?.firefoxProfile,
              prefs: runnerConfig?.firefoxPrefs,
              args: runnerConfig?.firefoxArgs,
            }
          : {
              chromiumBinary: runnerConfig?.binaries?.[config.browser],
              chromiumProfile: runnerConfig?.chromiumProfile,
              args: runnerConfig?.chromiumArgs,
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

      const webExt = await import('web-ext');
      runner = await webExt.default.cmd.run(finalConfig, options);
    },

    async closeBrowser() {
      return await runner?.exit();
    },
  };
}

// https://github.com/mozilla/web-ext/blob/e37e60a2738478f512f1255c537133321f301771/src/util/logger.js#L12
const WARN_LOG_LEVEL = 40;
const ERROR_LOG_LEVEL = 50;
