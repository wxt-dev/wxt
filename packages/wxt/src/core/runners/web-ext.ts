import type { WebExtRunInstance } from 'web-ext-run';
import { ExtensionRunner } from '../../types';
import { formatDuration } from '../utils/time';
import defu from 'defu';
import { wxt } from '../wxt';
import { hasGuiDisplay, isWsl } from '../utils/wsl';
import {
  isWindowsPath,
  resolveChromiumBinaryForRemoteDebuggingPipe,
  resolveProfilePath,
  sanitizePathForWslWithGui,
} from './browser-utils';
import path from 'node:path';

/**
 * Create an `ExtensionRunner` backed by `web-ext`.
 */
export function createWebExtRunner(): ExtensionRunner {
  let runner: WebExtRunInstance | undefined;

  return {
    canOpen() {
      return true;
    },
    async openBrowser() {
      const startTime = Date.now();

      if (
        wxt.config.browser === 'firefox' &&
        wxt.config.manifestVersion === 3
      ) {
        throw Error(
          'Dev mode does not support Firefox MV3. For alternatives, see https://github.com/wxt-dev/wxt/issues/230#issuecomment-1806881653',
        );
      }

      // Use WXT's logger instead of web-ext's built-in one.
      const webExtLogger = await import('web-ext-run/util/logger');
      webExtLogger.consoleStream.write = ({ level, msg, name }) => {
        if (level >= ERROR_LOG_LEVEL) wxt.logger.error(name, msg);
        if (level >= WARN_LOG_LEVEL) wxt.logger.warn(msg);
        if (level < WARN_LOG_LEVEL) wxt.logger.debug(name, msg);
      };

      const wxtUserConfig = wxt.config.runnerConfig.config;

      const runningInWsl = await isWsl();
      const runningInWslWithGui = runningInWsl && hasGuiDisplay();
      const sanitizePathForWslg = (value: string | undefined, label: string) =>
        sanitizePathForWslWithGui(
          value,
          label,
          runningInWslWithGui,
          '[web-ext] ',
        );

      const chromiumBinaryFromConfig =
        wxt.config.browser === 'firefox'
          ? undefined
          : sanitizePathForWslg(
              wxtUserConfig?.binaries?.[wxt.config.browser],
              `binaries.${wxt.config.browser}`,
            );
      const chromiumBinary = await resolveChromiumBinaryForRemoteDebuggingPipe({
        chromiumBinary: chromiumBinaryFromConfig,
        runningInWslWithGui,
        loggerPrefix: '[web-ext] ',
      });

      const chromiumUserDataDirOverride =
        wxt.config.browser === 'firefox'
          ? undefined
          : extractUserDataDirFromChromiumArgs(wxtUserConfig?.chromiumArgs);
      const shouldCoerceUserDataDirToProfile =
        runningInWslWithGui &&
        wxt.config.browser !== 'firefox' &&
        wxtUserConfig?.chromiumProfile == null &&
        wxtUserConfig?.keepProfileChanges == null &&
        chromiumUserDataDirOverride != null;

      const coercedChromiumProfile = shouldCoerceUserDataDirToProfile
        ? sanitizePathForWslg(
            resolveProfilePath(wxt.config.root, chromiumUserDataDirOverride),
            'chromiumProfile',
          )
        : sanitizePathForWslg(
            wxtUserConfig?.chromiumProfile,
            'chromiumProfile',
          );

      const coercedKeepProfileChanges =
        wxt.config.browser === 'firefox'
          ? wxtUserConfig?.keepProfileChanges
          : // Match the Windows docs behavior when a profile directory is used.
            // This prevents web-ext-run from creating a brand new temp profile on every launch.
            (wxtUserConfig?.keepProfileChanges ??
            (runningInWslWithGui && coercedChromiumProfile != null
              ? true
              : undefined));

      const coercedChromiumArgs =
        wxt.config.browser === 'firefox'
          ? wxtUserConfig?.chromiumArgs
          : shouldCoerceUserDataDirToProfile
            ? removeUserDataDirFromChromiumArgs(wxtUserConfig?.chromiumArgs)
            : wxtUserConfig?.chromiumArgs;

      if (shouldCoerceUserDataDirToProfile) {
        wxt.logger.warn(
          `[web-ext] In WSL with GUI, converting chromiumArgs "--user-data-dir" into { chromiumProfile, keepProfileChanges: true } to avoid creating throwaway profiles on each launch.`,
        );
      } else if (
        runningInWslWithGui &&
        wxt.config.browser !== 'firefox' &&
        wxtUserConfig?.chromiumProfile != null &&
        wxtUserConfig?.keepProfileChanges == null
      ) {
        wxt.logger.warn(
          `[web-ext] In WSL with GUI, defaulting keepProfileChanges=true because chromiumProfile is set to avoid creating throwaway profiles on each launch.`,
        );
      }

      const userConfig = {
        browserConsole: wxtUserConfig?.openConsole,
        devtools: wxtUserConfig?.openDevtools,
        startUrl: wxtUserConfig?.startUrls,
        keepProfileChanges: coercedKeepProfileChanges,
        chromiumPort: wxtUserConfig?.chromiumPort,
        ...(wxt.config.browser === 'firefox'
          ? {
              firefox: sanitizePathForWslg(
                wxtUserConfig?.binaries?.firefox,
                'binaries.firefox',
              ),
              firefoxProfile: sanitizePathForWslg(
                wxtUserConfig?.firefoxProfile,
                'firefoxProfile',
              ),
              prefs: wxtUserConfig?.firefoxPrefs,
              args: wxtUserConfig?.firefoxArgs,
            }
          : {
              chromiumBinary,
              chromiumProfile: coercedChromiumProfile,
              chromiumPref: defu(
                wxtUserConfig?.chromiumPref,
                DEFAULT_CHROMIUM_PREFS,
              ),
              args: [
                '--unsafely-disable-devtools-self-xss-warnings',
                ...(coercedChromiumArgs ?? []),
              ],
            }),
      };

      const finalConfig = {
        ...userConfig,
        target:
          wxt.config.browser === 'firefox' ? 'firefox-desktop' : 'chromium',
        sourceDir: wxt.config.outDir,
        // Don't add a "Reload Manager" extension alongside dev extension, WXT
        // already handles reloads intenrally.
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

      const webExt = await import('web-ext-run');
      runner = await webExt.default.cmd.run(finalConfig, options);

      const duration = Date.now() - startTime;
      wxt.logger.success(`Opened browser in ${formatDuration(duration)}`);
    },

    async closeBrowser() {
      return await runner?.exit();
    },
  };
}

function extractUserDataDirFromChromiumArgs(
  chromiumArgs: string[] | undefined,
): string | undefined {
  if (!chromiumArgs?.length) return undefined;

  for (let i = 0; i < chromiumArgs.length; i++) {
    const arg = chromiumArgs[i];
    if (arg == null) continue;

    const prefix = '--user-data-dir=';
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);

    if (arg === '--user-data-dir') {
      const next = chromiumArgs[i + 1];
      if (typeof next === 'string' && next.length > 0) return next;
      return undefined;
    }
  }

  return undefined;
}

function removeUserDataDirFromChromiumArgs(
  chromiumArgs: string[] | undefined,
): string[] | undefined {
  if (!chromiumArgs?.length) return chromiumArgs;

  const filtered: string[] = [];
  for (let i = 0; i < chromiumArgs.length; i++) {
    const arg = chromiumArgs[i];
    if (arg == null) continue;

    if (arg.startsWith('--user-data-dir=')) continue;
    if (arg === '--user-data-dir') {
      // Skip the value token too, if present.
      i++;
      continue;
    }

    filtered.push(arg);
  }

  return filtered;
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
