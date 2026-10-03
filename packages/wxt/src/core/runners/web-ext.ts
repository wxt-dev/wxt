import isWsl from 'is-wsl';
import { ExtensionRunner } from '../../types';
import { wxt } from '../wxt';
import { ManualRunner } from './manual';
import { formatDuration } from '../utils/time';
import defu from 'defu';

type WebExtModule = (typeof import('web-ext'))['default'];
type LoggerModule = typeof import('web-ext/util/logger');
const MODULE_NOT_FOUND_CODE = 'ERR_MODULE_NOT_FOUND';

/**
 * WXT's default `ExtensionRunner` that uses web-ext to open the browser. It
 * cannot open the browser automatically in some environments, like WSL.
 *
 * Because `web-ext` is a peer dependency, this runner falls back on the
 * `ManualRunner` when the module is not installed.
 */
export class WebExtRunner extends ManualRunner implements ExtensionRunner {
  private webExt: import('web-ext').WebExtRunInstance | undefined;
  private webExtModulePromise: Promise<WebExtModule> | undefined;
  private loggerModulePromise: Promise<LoggerModule> | undefined;

  async canOpen(): Promise<boolean> {
    if (wxt.config.browser === 'safari' || isWsl) return false;

    try {
      await this.loadWebExt();
      return true;
    } catch (err: any) {
      if (err?.code === MODULE_NOT_FOUND_CODE) return false;

      throw err;
    }
  }

  async openBrowser(): Promise<void> {
    if (wxt.config.browser === 'safari') {
      wxt.logger.warn(
        `Cannot Safari using web-ext. Load "${this.relativeOutDir()}" as an unpacked extension manually`,
      );
      return;
    }
    if (isWsl) {
      wxt.logger.warn(
        `Cannot open browser when using WSL. Load "${this.relativeOutDir()}" as an unpacked extension manually`,
      );
      return;
    }
    if (wxt.config.webExt.config.disabled) {
      return super.openBrowser();
    }

    try {
      const startTime = Date.now();
      const webExt = await this.loadWebExt();
      const logger = await this.loadLogger();

      // Use WXT's logger instead of web-ext's built-in one.
      logger.consoleStream.write = ({ level, msg, name }) => {
        if (level >= ERROR_LOG_LEVEL) wxt.logger.error(name, msg);
        if (level >= WARN_LOG_LEVEL) wxt.logger.warn(msg);
      };

      const wxtUserConfig = wxt.config.webExt.config;
      const userConfig = {
        browserConsole: wxtUserConfig?.openConsole,
        devtools: wxtUserConfig?.openDevtools,
        startUrl: wxtUserConfig?.startUrls,
        keepProfileChanges: wxtUserConfig?.keepProfileChanges,
        chromiumPort: wxtUserConfig?.chromiumPort,
        ...(wxt.config.browser === 'firefox'
          ? {
              firefox: wxtUserConfig?.binaries?.firefox,
              firefoxProfile: wxtUserConfig?.firefoxProfile,
              pref: wxtUserConfig?.firefoxPref,
              args: wxtUserConfig?.firefoxArgs,
            }
          : {
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
            }),
      };

      const finalConfig = {
        ...userConfig,
        target:
          wxt.config.browser === 'firefox' ? 'firefox-desktop' : 'chromium',
        sourceDir: wxt.config.outDir,
        // Don't add a "Reload Manager" extension alongside dev extension, WXT
        // already handles reloads internally.
        noReloadManagerExtension: true,
        // WXT handles reloads, so disable auto-reload behaviors in web-ext
        noReload: true,
        noInput: true,
      };
      const options = {
        // Don't call `process.exit(0)` after starting web-ext
        shouldExitProgram: false,
      };

      wxt.logger.debug('web-ext config:', finalConfig);
      wxt.logger.debug('web-ext options:', options);

      this.webExt = await webExt.cmd.run(finalConfig, options);

      const duration = Date.now() - startTime;
      wxt.logger.success(`Opened browser in ${formatDuration(duration)}`);
    } catch (err: any) {
      if (err?.code === MODULE_NOT_FOUND_CODE) return super.openBrowser();

      wxt.logger.warn('Error loading the web-ext runner', err);
    }
  }

  async closeBrowser(): Promise<void> {
    await this.webExt?.exit();
  }

  private loadWebExt(): Promise<WebExtModule> {
    this.webExtModulePromise ??= import('web-ext').then((mod) => mod.default);
    return this.webExtModulePromise;
  }

  private loadLogger(): Promise<LoggerModule> {
    this.loggerModulePromise ??= import('web-ext/util/logger');
    return this.loggerModulePromise;
  }
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
