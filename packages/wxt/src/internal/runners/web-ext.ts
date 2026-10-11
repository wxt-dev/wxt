import isWsl from 'is-wsl';
import { ExtensionRunner, ResolvedConfig } from '../../types';
import { formatDuration } from '../../internal-utils/time-utils';
import defu from 'defu';
import { relative } from 'node:path';

/**
 * WXT's default `ExtensionRunner` that uses web-ext to open the browser. It
 * cannot open the browser automatically in some environments, like WSL.
 */
export class WebExtRunner implements ExtensionRunner {
  private instance: import('web-ext').WebExtRunInstance | undefined;

  constructor(
    private webExt: (typeof import('web-ext'))['default'],
    private logger: typeof import('web-ext/util/logger'),
    private config: ResolvedConfig,
  ) {}

  async canOpen(): Promise<boolean> {
    return true;
  }

  async openBrowser(): Promise<void> {
    if (this.config.browser === 'safari') {
      return this.logManualReason('Cannot open Safari using web-ext');
    }
    if (isWsl) {
      return this.logManualReason('Cannot open browser when using WSL');
    }
    if (this.config.webExt.config.disabled) {
      return this.config.logger.info(this.loadManualMessage());
    }

    const startTime = Date.now();

    // Use WXT's logger instead of web-ext's built-in one.
    this.logger.consoleStream.write = ({ level, msg, name }) => {
      if (level >= ERROR_LOG_LEVEL) this.config.logger.error(name, msg);
      if (level >= WARN_LOG_LEVEL) this.config.logger.warn(msg);
    };

    const wxtUserConfig = this.config.webExt.config;
    const userConfig = {
      browserConsole: wxtUserConfig?.openConsole,
      devtools: wxtUserConfig?.openDevtools,
      startUrl: wxtUserConfig?.startUrls,
      keepProfileChanges: wxtUserConfig?.keepProfileChanges,
      chromiumPort: wxtUserConfig?.chromiumPort,
      ...(this.config.browser === 'firefox'
        ? {
            firefox: wxtUserConfig?.binaries?.firefox,
            firefoxProfile: wxtUserConfig?.firefoxProfile,
            pref: wxtUserConfig?.firefoxPref,
            args: wxtUserConfig?.firefoxArgs,
          }
        : {
            chromiumBinary: wxtUserConfig?.binaries?.[this.config.browser],
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
        this.config.browser === 'firefox' ? 'firefox-desktop' : 'chromium',
      sourceDir: this.config.outDir,
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

    this.config.logger.debug('web-ext config:', finalConfig);
    this.config.logger.debug('web-ext options:', options);

    this.instance = await this.webExt.cmd.run(finalConfig, options);

    const duration = Date.now() - startTime;
    this.config.logger.success(`Opened browser in ${formatDuration(duration)}`);
  }

  async closeBrowser(): Promise<void> {
    await this.instance?.exit();
  }

  private logManualReason(reason: string): void {
    this.config.logger.warn(`${reason}. ${this.loadManualMessage()}`);
  }

  private loadManualMessage(): string {
    return `Load "${relative(process.cwd(), this.config.outDir)}" as an unpacked extension manually`;
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
