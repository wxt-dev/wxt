import {
  FALLBACK_TARGETS,
  KNOWN_BROWSER_PATHS,
  KnownTarget,
  type BrowserPlatform,
} from './browser-paths';
import { resolve, join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { debug } from './debug';
import { mkdtemp, open } from 'node:fs/promises';

const debugOptions = debug.scoped('options');

export type UnknownTarget = string & {};
export type Target = KnownTarget | UnknownTarget;

export type RunOptions = {
  /** Paths to binaries to use for each target. */
  browserBinaries?: Record<string, string>;
  /** Customize the arguments passed to the chromium binary. Conflicting arguments with required ones to install extensions are ignored. */
  chromiumArgs?: string[];
  /** Control how data is persisted between launches. Either save data at a user level, project level, or don't persist data at all. Defaults to `project`. */
  dataPersistence?: 'user' | 'project' | 'none';
  /** Customize the port Chrome's debugger is listening on. Defaults to a random open port. */
  chromiumRemoteDebuggingPort?: number;
  /** Directory where the extension will be installed from. Should contain a `manifest.json` file. Can be relative to the current working directory. Defaults to the current working directory. */
  extensionDir?: string;
  /** Customize the arguments passed to the firefox binary. Conflicting arguments with required ones to install extensions are ignored. */
  firefoxArgs?: string[];
  /** Customize the port Firefox's debugger is listening on. Defaults to a random open port. */
  firefoxRemoteDebuggingPort?: number;
  /** Specify the browser to open. Defaults to `"chrome"`, but you can pass any string. */
  target?: Target;
};

export type ResolvedRunOptions = {
  /** Absolute path to the browser binary. */
  browserBinary: string;
  chromiumArgs: string[];
  chromiumRemoteDebuggingPort: number;
  /** Absolute path to the directory where browser data will be stored. */
  dataDir: string;
  dataPersistence: 'user' | 'project' | 'none';
  /** Absolute path to the extension directory. */
  extensionDir: string;
  firefoxArgs: string[];
  firefoxRemoteDebuggingPort: number;
  target: string;
};

export async function resolveRunOptions(
  options: RunOptions | undefined,
): Promise<ResolvedRunOptions> {
  debugOptions('User options:', options);

  const target = options?.target || 'chrome';

  const _browserBinary =
    options?.browserBinaries?.[target] ?? (await findBrowserBinary(target));
  if (!_browserBinary)
    throw Error(
      `Could not find "${target}" binary.\n\nIf it is installed in a custom location, you can specify the path with the browserPaths option.`,
    );

  // Denormalize the path so it uses the correct path separator for the OS
  const browserBinary = resolve(_browserBinary);

  const chromiumRemoteDebuggingPort = options?.chromiumRemoteDebuggingPort ?? 0;
  const firefoxRemoteDebuggingPort = options?.firefoxRemoteDebuggingPort ?? 0;
  const dataPersistence = options?.dataPersistence ?? 'none';
  const dataDir =
    dataPersistence === 'user'
      ? join(homedir(), '.wxt-runner', target)
      : dataPersistence === 'project'
        ? resolve('.wxt-runner', target)
        : dataPersistence === 'none'
          ? await mkdtemp(join(tmpdir(), 'wxt-runner-'))
          : resolve(dataPersistence);

  const resolved: ResolvedRunOptions = {
    browserBinary,
    chromiumArgs: resolveChromiumArgs(
      options?.chromiumArgs,
      chromiumRemoteDebuggingPort,
      dataDir,
    ),
    dataDir,
    dataPersistence,
    chromiumRemoteDebuggingPort,
    extensionDir: resolve(options?.extensionDir ?? '.'),
    firefoxArgs: resolveFirefoxArgs(
      options?.firefoxArgs,
      firefoxRemoteDebuggingPort,
      dataDir,
    ),
    firefoxRemoteDebuggingPort,
    target,
  };
  debugOptions('Resolved options:', resolved);
  return resolved;
}

async function findBrowserBinary(target: string): Promise<string | undefined> {
  const targets = new Set<KnownTarget>([target as KnownTarget]);
  FALLBACK_TARGETS[target as KnownTarget]?.forEach((fallback) =>
    targets.add(fallback),
  );
  const platform = getPlatform();

  for (const target of targets) {
    const potentialPaths = KNOWN_BROWSER_PATHS[target]?.[platform] ?? [];
    for (const path of potentialPaths) {
      if (await exists(path)) return path;
    }
  }
}

function getPlatform(): BrowserPlatform {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'mac';
    default:
      return 'linux';
  }
}

function resolveChromiumArgs(
  userArgs: string[] | undefined,
  chromiumRemoteDebuggingPort: ResolvedRunOptions['chromiumRemoteDebuggingPort'],
  dataDir: string,
): string[] {
  return deduplicateArgs(
    [
      // Limit features to improve performance
      ...CHROME_LAUNCHER_DEFAULT_FLAGS,
      // Enable debugging
      `--remote-debugging-port=${chromiumRemoteDebuggingPort}`,
      // Required for installing extensions
      `--remote-debugging-pipe`,
      `--user-data-dir=${dataDir}`,
      `--enable-unsafe-extension-debugging`,
    ],
    userArgs,
    {
      '--remote-debugging-port':
        '\x1b[1m\x1b[33mCustom Chromium --remote-debugging-port argument ignored.\x1b[0m Use \x1b[36mchromiumRemoteDebuggingPort\x1b[0m option instead.',
      '--user-data-dir':
        '\x1b[1m\x1b[33mCustom Chromium --user-data-dir argument ignored.\x1b[0m Use \x1b[36mdataPersistence\x1b[0m option instead.',
    },
  );
}

function resolveFirefoxArgs(
  userArgs: string[] | undefined,
  firefoxRemoteDebuggingPort: ResolvedRunOptions['firefoxRemoteDebuggingPort'],
  dataDir: string,
): string[] {
  return deduplicateArgs(
    [
      // Allows opening multiple instances of Firefox at the same time
      `--new-instance`,
      `--no-remote`,
      `--profile`,
      dataDir,
      // Required for installing extensions
      `--remote-debugging-port=${firefoxRemoteDebuggingPort}`,
      // Default URL to start with
      `about:debugging#/runtime/this-firefox`,
    ],
    userArgs,
    {
      '--remote-debugging-port':
        '\x1b[1m\x1b[33mCustom Firefox --remote-debugging-port argument ignored.\x1b[0m Use \x1b[36mfirefoxDebuggerPort\x1b[0m option instead.',
      '--profile':
        '\x1b[1m\x1b[33mCustom Firefox --profile argument ignored.\x1b[0m Use \x1b[36mdataPersistence\x1b[0m option instead.',
    },
  );
}

function deduplicateArgs(
  requiredArgs: string[],
  userArgs: string[] | undefined,
  warnings: Record<string, string>,
): string[] {
  const getKey = (arg: string) => {
    return arg.startsWith('--') ? arg.split('=')[0] : arg;
  };
  const alreadyAdded = new Set<string>(requiredArgs.map(getKey));

  const args = [...requiredArgs];
  userArgs?.forEach((arg) => {
    const key = getKey(arg);
    if (alreadyAdded.has(key)) {
      if (warnings[key]) console.warn(`[@wxt-dev/runner] ${warnings[key]}`);
    } else {
      alreadyAdded.add(key);
      args.push(arg);
    }
  });

  return args;
}

async function exists(path: string): Promise<boolean> {
  try {
    await open(path, 'r');
    return true;
  } catch (err) {
    // @ts-expect-error: Unknown error type
    if (err?.code === 'ENOENT') return false;
    throw err;
  }
}

/**
 * Copied from https://github.com/GoogleChrome/chrome-launcher/blob/main/src/flags.ts
 * with some flags commented out. Run tests after updating to compare.
 */
const CHROME_LAUNCHER_DEFAULT_FLAGS = [
  '--disable-features=' +
    [
      // Disable built-in Google Translate service
      'Translate',
      // Disable the Chrome Optimization Guide background networking
      'OptimizationHints',
      //  Disable the Chrome Media Router (cast target discovery) background networking
      'MediaRouter',
      /// Avoid the startup dialog for _Do you want the application “Chromium.app” to accept incoming network connections?_. This is a sub-component of the MediaRouter.
      'DialMediaRouteProvider',
      // Disable the feature of: Calculate window occlusion on Windows will be used in the future to throttle and potentially unload foreground tabs in occluded windows.
      'CalculateNativeWinOcclusion',
      // Disables the Discover feed on NTP
      'InterestFeedContentSuggestions',
      // Don't update the CT lists
      'CertificateTransparencyComponentUpdater',
      // Disables autofill server communication. This feature isn't disabled via other 'parent' flags.
      'AutofillServerCommunication',
      // Disables "Enhanced ad privacy in Chrome" dialog (though as of 2024-03-20 it shouldn't show up if the profile has no stored country).
      'PrivacySandboxSettings4',
    ].join(','),

  // Disable some extensions that aren't affected by --disable-extensions
  '--disable-component-extensions-with-background-pages',
  // Disable various background network services, including extension updating,
  //   safe browsing service, upgrade detector, translate, UMA
  '--disable-background-networking',
  // Don't update the browser 'components' listed at chrome://components/
  '--disable-component-update',
  // Disables client-side phishing detection.
  '--disable-client-side-phishing-detection',
  // Disable syncing to a Google account
  '--disable-sync',
  // Disable reporting to UMA, but allows for collection
  '--metrics-recording-only',
  // Disable installation of default apps on first run
  '--disable-default-apps',
  // Disable the default browser check, do not prompt to set it as such
  '--no-default-browser-check',
  // Skip first run wizards
  '--no-first-run',
  // Disable task throttling of timer tasks from background pages.
  '--disable-background-timer-throttling',
  // Disable the default throttling of IPC between renderer & browser processes.
  '--disable-ipc-flooding-protection',
  // Avoid potential instability of using Gnome Keyring or KDE wallet. crbug.com/571003 crbug.com/991424
  '--password-store=basic',
  // Use mock keychain on Mac to prevent blocking permissions dialogs
  '--use-mock-keychain',
  // Disable background tracing (aka slow reports & deep reports) to avoid 'Tracing already started'
  '--force-fieldtrials=*BackgroundTracing/default/',

  // Suppresses hang monitor dialogs in renderer processes. This flag may allow slow unload handlers on a page to prevent the tab from closing.
  '--disable-hang-monitor',
  // Reloading a page that came from a POST normally prompts the user.
  '--disable-prompt-on-repost',
  // Disables Domain Reliability Monitoring, which tracks whether the browser has difficulty contacting Google-owned sites and uploads reports to Google.
  '--disable-domain-reliability',
  // Disable the in-product Help (IPH) system.
  '--propagate-iph-for-testing',
];
