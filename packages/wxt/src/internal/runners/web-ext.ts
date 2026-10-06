import isWsl from 'is-wsl';
import { ExtensionRunner, ResolvedConfig } from '../../types';
import { formatDuration } from '../../internal-utils/time-utils';
import defu from 'defu';
import { relative } from 'node:path';
import {
  createWslChromiumProfile,
  findLinuxChromium,
  hasDisplay,
  isUnusableSnap,
  which,
  WslChromiumProfile,
} from '../../internal-utils/wsl-utils';

const WSL_DOCS_URL =
  'https://wxt.dev/guide/essentials/config/browser-startup.html#wsl';

/**
 * WXT's default `ExtensionRunner` that uses web-ext to open the browser. In
 * WSL, it can only open browsers installed inside WSL.
 */
export class WebExtRunner implements ExtensionRunner {
  private instance: import('web-ext').WebExtRunInstance | undefined;
  private wslProfile: WslChromiumProfile | undefined;

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
    if (this.config.webExt.config.disabled) {
      return this.config.logger.info(this.loadManualMessage());
    }

    const wxtUserConfig = this.config.webExt.config;
    let chromiumBinary = wxtUserConfig?.binaries?.[this.config.browser];
    if (isWsl) {
      if (!hasDisplay()) {
        return this.logWslReason(
          'Cannot open a browser when using WSL without a display, like WSLg',
        );
      }
      if (this.config.browser === 'firefox') {
        const firefox =
          wxtUserConfig?.binaries?.firefox ?? (await which('firefox'));
        if (firefox && (await isUnusableSnap(firefox))) {
          return this.logWslReason(
            'Cannot open the Snap version of Firefox when using WSL',
          );
        }
      } else {
        chromiumBinary = await findLinuxChromium(chromiumBinary);
        if (!chromiumBinary) {
          return this.logWslReason(
            'Cannot find a Chromium browser installed inside WSL',
          );
        }
        if (await isUnusableSnap(chromiumBinary)) {
          return this.logWslReason(
            'Cannot open the Snap version of Chromium when using WSL',
          );
        }
        await this.prepareWslProfile();
      }
    }

    const startTime = Date.now();

    // Use WXT's logger instead of web-ext's built-in one.
    this.logger.consoleStream.write = ({ level, msg, name }) => {
      if (level >= ERROR_LOG_LEVEL) this.config.logger.error(name, msg);
      if (level >= WARN_LOG_LEVEL) this.config.logger.warn(msg);
    };

    const userConfig = {
      browserConsole: wxtUserConfig?.openConsole,
      devtools: wxtUserConfig?.openDevtools,
      startUrl: wxtUserConfig?.startUrls,
      keepProfileChanges: this.wslProfile
        ? true
        : wxtUserConfig?.keepProfileChanges,
      chromiumPort: wxtUserConfig?.chromiumPort,
      ...(this.config.browser === 'firefox'
        ? {
            firefox: wxtUserConfig?.binaries?.firefox,
            firefoxProfile: wxtUserConfig?.firefoxProfile,
            pref: wxtUserConfig?.firefoxPref,
            args: wxtUserConfig?.firefoxArgs,
          }
        : {
            chromiumBinary,
            chromiumProfile:
              this.wslProfile?.chromiumProfile ??
              wxtUserConfig?.chromiumProfile,
            chromiumPref: defu(
              wxtUserConfig?.chromiumPref,
              DEFAULT_CHROMIUM_PREFS,
            ),
            args: [
              '--unsafely-disable-devtools-self-xss-warnings',
              ...(this.wslProfile?.args ?? []),
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

    try {
      this.instance = await this.webExt.cmd.run(finalConfig, options);
    } catch (err) {
      await this.cleanupWslProfile();
      throw err;
    }

    const duration = Date.now() - startTime;
    this.config.logger.success(`Opened browser in ${formatDuration(duration)}`);
  }

  async closeBrowser(): Promise<void> {
    await this.instance?.exit();
    await this.cleanupWslProfile();
  }

  private async prepareWslProfile(): Promise<void> {
    const { chromiumProfile, chromiumArgs, keepProfileChanges } =
      this.config.webExt.config;

    // The user's own `--user-data-dir` comes last and already wins.
    if (chromiumArgs?.some((arg) => arg.startsWith('--user-data-dir'))) return;

    // `web-ext` copies the profile to a temporary directory WXT can't override.
    if (chromiumProfile && !keepProfileChanges) {
      return this.config.logger.warnOnce(
        `\`chromiumProfile\` is ignored when using WSL unless \`keepProfileChanges\` is enabled. For more details, see: ${WSL_DOCS_URL}`,
      );
    }

    this.wslProfile = await createWslChromiumProfile(chromiumProfile);
  }

  private async cleanupWslProfile(): Promise<void> {
    await this.wslProfile?.cleanup();
    this.wslProfile = undefined;
  }

  private logManualReason(reason: string): void {
    this.config.logger.warn(`${reason}. ${this.loadManualMessage()}`);
  }

  private logWslReason(reason: string): void {
    this.config.logger.warn(
      `${reason}. ${this.loadManualMessage()}. For more details, see: ${WSL_DOCS_URL}`,
    );
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
