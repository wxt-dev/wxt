import { ExtensionRunner } from '../../types';
import { formatDuration } from '../utils/time';
import { wxt } from '../wxt';
import {
  KNOWN_BROWSER_PATHS,
  run,
  type KnownTarget,
  type Runner as WxtRunnerInstance,
} from '@wxt-dev/runner';
import * as fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';

const KNOWN_TARGETS = new Set<string>(Object.keys(KNOWN_BROWSER_PATHS));
function isKnownTarget(value: string): value is KnownTarget {
  return KNOWN_TARGETS.has(value);
}

const FIREFOX_FAMILY_TARGETS = [
  'firefox',
  'firefox-nightly',
  'firefox-developer-edition',
  'zen',
] as const satisfies readonly KnownTarget[];
type FirefoxFamilyTarget = (typeof FIREFOX_FAMILY_TARGETS)[number];

function isFirefoxFamilyTarget(
  target: KnownTarget,
): target is FirefoxFamilyTarget {
  return (FIREFOX_FAMILY_TARGETS as readonly string[]).includes(target);
}

export function createWxtRunner(): ExtensionRunner {
  let runner: WxtRunnerInstance | undefined;

  return {
    canOpen() {
      return true;
    },

    async openBrowser() {
      const startTime = Date.now();

      const userConfig = wxt.config.runnerConfig.config;
      const browser = wxt.config.browser;

      if (!isKnownTarget(browser)) {
        throw Error(
          `Internal runner does not support browser="${browser}". Use a Chromium/Firefox family browser, or disable the runner with runnerConfig.config.disabled=true.`,
        );
      }

      if (isFirefoxFamilyTarget(browser) && wxt.config.manifestVersion === 3) {
        throw Error(
          'Dev mode does not support Firefox MV3. For alternatives, see https://github.com/wxt-dev/wxt/issues/230#issuecomment-1806881653',
        );
      }

      const runningInWslg = process.env.DISPLAY === ':0';

      const binaryFromConfig = sanitizePathForWslg(
        userConfig?.binaries?.[browser],
        `binaries.${browser}`,
        runningInWslg,
      );

      const browserBinaryOverride = !isFirefoxFamilyTarget(browser)
        ? await resolveChromiumBinaryForRemoteDebuggingPipe({
            chromiumBinary: binaryFromConfig,
            runningInWslg,
          })
        : binaryFromConfig;

      const startUrls = Array.isArray(userConfig?.startUrls)
        ? userConfig.startUrls
        : undefined;

      if (isFirefoxFamilyTarget(browser)) {
        const firefoxArgs: string[] = [...(userConfig?.firefoxArgs ?? [])];
        if (startUrls) firefoxArgs.push(...startUrls);

        const firefoxProfile = sanitizePathForWslg(
          userConfig?.firefoxProfile,
          'firefoxProfile',
          runningInWslg,
        );

        const dataPersistence =
          firefoxProfile != null || userConfig?.keepProfileChanges
            ? 'project'
            : 'none';
        const projectDataDir =
          firefoxProfile != null
            ? resolveProfilePath(wxt.config.root, firefoxProfile)
            : undefined;

        const runOptions = {
          target: browser,
          extensionDir: wxt.config.outDir,
          firefoxArgs,
          dataPersistence,
          projectDataDir,
        } as Parameters<typeof run>[0];

        if (browserBinaryOverride) {
          runOptions.browserBinaries = {
            [browser]: browserBinaryOverride,
          };
        }

        runner = await run(runOptions);
      } else {
        const chromiumArgs: string[] = [
          '--unsafely-disable-devtools-self-xss-warnings',
          ...(userConfig?.chromiumArgs ?? []),
        ];

        if (userConfig?.openDevtools) {
          chromiumArgs.push('--auto-open-devtools-for-tabs');
        }

        if (startUrls) {
          chromiumArgs.push(...startUrls);
        }

        const chromiumProfile = sanitizePathForWslg(
          userConfig?.chromiumProfile,
          'chromiumProfile',
          runningInWslg,
        );

        const dataPersistence =
          chromiumProfile != null || userConfig?.keepProfileChanges
            ? 'project'
            : 'none';
        const projectDataDir =
          chromiumProfile != null
            ? resolveProfilePath(wxt.config.root, chromiumProfile)
            : undefined;

        const runOptions = {
          target: browser,
          extensionDir: wxt.config.outDir,
          chromiumArgs,
          chromiumRemoteDebuggingPort: userConfig?.chromiumPort,
          dataPersistence,
          projectDataDir,
        } as Parameters<typeof run>[0];

        if (browserBinaryOverride) {
          runOptions.browserBinaries = {
            [browser]: browserBinaryOverride,
          };
        }

        runner = await run(runOptions);
      }

      const duration = Date.now() - startTime;
      wxt.logger.success(`Opened browser in ${formatDuration(duration)}`);
    },

    async closeBrowser() {
      runner?.stop();
      runner = undefined;
    },
  };
}

function sanitizePathForWslg(
  value: string | undefined,
  label: string,
  runningInWslg: boolean,
): string | undefined {
  if (!runningInWslg || value == null) return value;
  if (isWindowsPath(value)) {
    wxt.logger.warn(
      `[runner] Ignoring ${label}="${value}" on WSLg (DISPLAY=:0). Windows paths/binaries are incompatible with CDP pipe extension install. Install a Linux browser in WSL and omit this setting.`,
    );
    return undefined;
  }
  return value;
}

function isWindowsPath(value: string): boolean {
  // Windows drive path: C:\...
  if (/^[a-zA-Z]:\\/.test(value)) return true;
  // WSL mounted drive: /mnt/c/...
  if (/^\/mnt\/[a-zA-Z]\//.test(value)) return true;
  // UNC-ish
  if (value.startsWith('\\\\')) return true;
  return false;
}

async function resolveChromiumBinaryForRemoteDebuggingPipe({
  chromiumBinary,
  runningInWslg,
}: {
  chromiumBinary: string | undefined;
  runningInWslg: boolean;
}): Promise<string | undefined> {
  if (!runningInWslg) return chromiumBinary;

  const googleChromeRealBinary = '/opt/google/chrome/chrome';
  const hasRealGoogleChrome = await isExecutable(googleChromeRealBinary);

  if (chromiumBinary == null) {
    if (hasRealGoogleChrome) return googleChromeRealBinary;
    return chromiumBinary;
  }

  if (hasRealGoogleChrome && looksLikeGoogleChromeWrapper(chromiumBinary)) {
    wxt.logger.warn(
      `[runner] Using "${googleChromeRealBinary}" instead of "${chromiumBinary}" on WSLg to keep the CDP pipe open (avoids "Remote debugging pipe file descriptors are not open").`,
    );
    return googleChromeRealBinary;
  }

  if (looksLikeGoogleChromeWrapper(chromiumBinary)) {
    const resolved = await fs
      .realpath(chromiumBinary)
      .catch(() => chromiumBinary);
    const sibling = path.join(path.dirname(resolved), 'chrome');
    if (await isExecutable(sibling)) return sibling;
  }

  return chromiumBinary;
}

async function isExecutable(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function looksLikeGoogleChromeWrapper(filePath: string): boolean {
  const base = path.basename(filePath);
  if (base === 'google-chrome') return true;
  if (base === 'google-chrome-stable') return true;
  if (base === 'google-chrome-beta') return true;
  if (base === 'google-chrome-dev') return true;
  if (base === 'google-chrome-unstable') return true;
  if (filePath === '/opt/google/chrome/google-chrome') return true;
  return false;
}

function resolveProfilePath(projectRoot: string, profileDir: string): string {
  return path.isAbsolute(profileDir)
    ? profileDir
    : path.resolve(projectRoot, profileDir);
}
