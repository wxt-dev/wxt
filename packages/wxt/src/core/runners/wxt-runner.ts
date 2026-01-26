import { ExtensionRunner } from '../../types';
import { formatDuration } from '../utils/time';
import { wxt } from '../wxt';
import { hasGuiDisplay } from '../utils/wsl';
import {
  KNOWN_BROWSER_PATHS,
  run,
  type KnownTarget,
  type Runner as WxtRunnerInstance,
} from '@wxt-dev/runner';
import {
  resolveChromiumBinaryForRemoteDebuggingPipe,
  resolveProfilePath,
  sanitizePathForWslWithGui,
} from './browser-utils';

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

      const runningInWslWithGui = hasGuiDisplay();

      const binaryFromConfig = sanitizePathForWslWithGui(
        userConfig?.binaries?.[browser],
        `binaries.${browser}`,
        runningInWslWithGui,
        '[runner] ',
      );

      const browserBinaryOverride = !isFirefoxFamilyTarget(browser)
        ? await resolveChromiumBinaryForRemoteDebuggingPipe({
            chromiumBinary: binaryFromConfig,
            runningInWslWithGui,
            loggerPrefix: '[runner] ',
          })
        : binaryFromConfig;

      const startUrls = Array.isArray(userConfig?.startUrls)
        ? userConfig.startUrls
        : undefined;

      if (isFirefoxFamilyTarget(browser)) {
        const firefoxArgs: string[] = [...(userConfig?.firefoxArgs ?? [])];
        if (startUrls) firefoxArgs.push(...startUrls);

        const firefoxProfile = sanitizePathForWslWithGui(
          userConfig?.firefoxProfile,
          'firefoxProfile',
          runningInWslWithGui,
          '[runner] ',
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

        const chromiumProfile = sanitizePathForWslWithGui(
          userConfig?.chromiumProfile,
          'chromiumProfile',
          runningInWslWithGui,
          '[runner] ',
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
