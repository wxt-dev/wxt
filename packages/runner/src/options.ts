import { KNOWN_BROWSER_PATHS, type BrowserPlatform } from './browser-paths';
import { resolve } from 'node:path';
import { debug } from './debug';
import { open } from 'node:fs/promises';

const debugOptions = debug.scoped('options');

export type KnownTarget =
  | 'chromium'
  | 'chrome'
  | 'chrome-beta'
  | 'chrome-dev'
  | 'chrome-canary'
  | 'edge'
  | 'edge-beta'
  | 'edge-dev'
  | 'edge-canary'
  | 'firefox'
  | 'firefox-nightly'
  | 'firefox-developer-edition'
  | 'zen';
export type UnknownTarget = string & {};
export type Target = KnownTarget | UnknownTarget;

export type RunOptions = {
  /** Paths to binaries to use for each target. */
  browserBinaries?: Record<string, string>;
  /** Customize the arguments passed to the chromium binary. Conflicting arguments with required ones to install extensions are ignored. */
  chromiumArgs?: string[];
  /** Control how data is persisted between launches. */
  chromiumDataPersistence?: unknown;
  /** Customize the port Chrome's debugger is listening on. Defaults to a random open port. */
  chromiumRemoteDebuggingPort?: number;
  /** Directory where the extension will be installed from. Should contain a `manifest.json` file. Can be relative to the current working directory. */
  extensionDir: string;
  /** Customize the arguments passed to the firefox binary. Conflicting arguments with required ones to install extensions are ignored. */
  firefoxArgs?: string[];
  /** Customize the port Firefox's debugger is listening on. Defaults to a random open port. */
  firefoxRemoteDebuggingPort?: number;
  /** Specify the browser to open. Defaults to `"chrome"`. */
  target?: Target;
};

export type ResolvedRunOptions = {
  /** Absolute path to the browser binary. */
  browserBinary: string;
  chromiumArgs: string[];
  chromiumDataPersistence: unknown;
  chromiumRemoteDebuggingPort: number;
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

  const browserBinary =
    options?.browserBinaries?.[target] ?? (await findBrowserBinary(target));
  if (!browserBinary)
    throw Error(
      `Could not find "${target}" binary.\n\nIf it is installed in a custom location, you can specify the path with the browserPaths option.`,
    );

  const chromiumRemoteDebuggingPort = options?.chromiumRemoteDebuggingPort ?? 0;
  const firefoxRemoteDebuggingPort = options?.firefoxRemoteDebuggingPort ?? 0;
  const chromiumDataPersistence = '.wxt/runner/' + target;

  const resolved: ResolvedRunOptions = {
    browserBinary,
    chromiumArgs: resolveChromiumArgs(
      options?.chromiumArgs,
      chromiumRemoteDebuggingPort,
      chromiumDataPersistence,
    ),
    chromiumDataPersistence,
    chromiumRemoteDebuggingPort,
    extensionDir: resolve(options?.extensionDir ?? '.'),
    firefoxArgs: resolveFirefoxArgs(
      options?.firefoxArgs,
      firefoxRemoteDebuggingPort,
    ),
    firefoxRemoteDebuggingPort,
    target,
  };
  debugOptions('Resolved options:', resolved);
  return resolved;
}

async function findBrowserBinary(target: string): Promise<string | undefined> {
  const potentialPaths = KNOWN_BROWSER_PATHS[target]?.[getPlatform()] ?? [];
  for (const path of potentialPaths) {
    if (await exists(path)) return path;
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
  chromiumDataPersistence: ResolvedRunOptions['chromiumDataPersistence'],
): string[] {
  return deduplicateArgs(
    [
      `--no-first-run`,
      `--remote-debugging-port=${chromiumRemoteDebuggingPort}`,
      `--remote-debugging-pipe`,
      `--user-data-dir=${resolve(chromiumDataPersistence as string)}`,
      `--enable-unsafe-extension-debugging`,
    ],
    userArgs,
    {
      '--remote-debugging-port':
        '\x1b[1m\x1b[33mCustom chromium --remote-debugging-port argument ignored.\x1b[0m Use \x1b[36mchromiumRemoteDebuggingPort\x1b[0m option instead.',
      '--user-data-dir':
        '\x1b[1m\x1b[33mCustom chromium --user-data-dir argument ignored.\x1b[0m Use \x1b[36mchromiumDataPersistence\x1b[0m option instead.',
    },
  );
}

function resolveFirefoxArgs(
  userArgs: string[] | undefined,
  firefoxRemoteDebuggingPort: ResolvedRunOptions['firefoxRemoteDebuggingPort'],
): string[] {
  return deduplicateArgs(
    [
      `--new-instance`,
      `--remote-debugging-port=${firefoxRemoteDebuggingPort}`,
      `about:debugging#/runtime/this-firefox`,
    ],
    userArgs,
    {
      '--remote-debugging-port':
        '\x1b[1m\x1b[33mCustom firefox --remote-debugging-port argument ignored.\x1b[0m Use \x1b[36mfirefoxDebuggerPort\x1b[0m option instead.',
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
