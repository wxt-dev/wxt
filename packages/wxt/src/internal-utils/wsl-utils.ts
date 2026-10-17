import {
  access,
  constants,
  mkdtemp,
  open,
  realpath,
  rm,
} from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, dirname, isAbsolute, join, relative, sep } from 'node:path';
import { pathExists } from './fs-utils';

/**
 * Returns true when GUI apps can open, either with WSLg or an X server. WSL
 * only sets these when GUI apps are enabled, and browsers use either one.
 */
export function hasDisplay(): boolean {
  return !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
}

/** Commands `chrome-launcher` looks for on Linux, in the same order. */
const LINUX_CHROMIUM_COMMANDS = [
  'google-chrome-stable',
  'google-chrome',
  'chromium-browser',
  'chromium',
];

/**
 * Returns the Chromium binary to launch inside WSL, or `undefined` for a
 * Windows binary. A non-Snap binary on the `PATH` is preferred.
 */
export async function findLinuxChromium(
  binary: string | undefined,
): Promise<string | undefined> {
  // A Windows Chrome can't be controlled from WSL: `--remote-debugging-pipe`
  // uses file descriptors 3 and 4, and WSL only passes stdio through.
  if (binary) return isWindowsPath(binary) ? undefined : binary;

  let snap: string | undefined;
  for (const command of LINUX_CHROMIUM_COMMANDS) {
    const path = await which(command);
    if (!path) continue;
    if (!(await isUnusableSnap(path))) return path;
    snap ??= path;
  }
  return snap;
}

/**
 * Returns true for a Snap browser that can't load `web-ext`'s temporary
 * profile, since its sandbox can only read the user's home directory.
 */
export async function isUnusableSnap(binary: string): Promise<boolean> {
  if (isInside(tmpdir(), homedir())) return false;

  // A command name like `firefox` is looked up on the `PATH`.
  const path = binary.includes('/') ? binary : await which(binary);
  if (!path) return false;

  try {
    // Check before resolving: `/snap/bin/firefox` links to `/usr/bin/snap`.
    if (path.includes('/snap/')) return true;
    const resolved = await realpath(path);
    if (resolved.includes('/snap/')) return true;

    // Ubuntu's `/usr/bin/firefox` and `/usr/bin/chromium-browser` are shell
    // scripts that run the Snap, while other builds are ELF binaries.
    const file = await open(resolved);
    try {
      const { buffer, bytesRead } = await file.read({
        buffer: Buffer.alloc(4096),
      });
      const head = buffer.subarray(0, bytesRead);
      if (head.subarray(0, 4).toString('latin1') === '\x7fELF') return false;
      return head.toString('utf8').includes('/snap/bin/');
    } finally {
      await file.close();
    }
  } catch {
    return false;
  }
}

export interface WslChromiumProfile {
  /** Passed to `web-ext` as `chromiumProfile`, with `keepProfileChanges`. */
  chromiumProfile: string;
  /** Chrome args that override `chrome-launcher`'s `--user-data-dir`. */
  args: string[];
  cleanup(): Promise<void>;
}

/**
 * Returns a Chromium profile whose `--user-data-dir` can be passed again in the
 * Chrome args. A temporary one is created when no `chromiumProfile` is given.
 */
export async function createWslChromiumProfile(
  chromiumProfile: string | undefined,
): Promise<WslChromiumProfile> {
  // Inside WSL, `chrome-launcher` rewrites `--user-data-dir` into a Windows UNC
  // path, so a Linux Chrome creates a `\\wsl.localhost\...` folder in the cwd.
  // Chrome uses the last `--user-data-dir`, so passing it again overrides it.
  // See https://github.com/GoogleChrome/chrome-launcher/issues/334
  if (chromiumProfile) {
    // Same as `web-ext`: a profile directory inside a user data directory is
    // launched with its parent as the user data directory.
    const isProfileDir =
      (await pathExists(join(chromiumProfile, 'Secure Preferences'))) &&
      !(await pathExists(join(chromiumProfile, 'Local State')));
    const userDataDir = isProfileDir
      ? dirname(chromiumProfile)
      : chromiumProfile;
    return {
      chromiumProfile,
      args: [`--user-data-dir=${userDataDir}`],
      cleanup: async () => {},
    };
  }

  const dir = await mkdtemp(join(tmpdir(), 'wxt-chromium-profile-'));
  // `chrome-launcher` calls `process.exit()` on Ctrl+C, before the browser is
  // closed and the profile cleaned up.
  const removeOnExit = () => rmSync(dir, { recursive: true, force: true });
  process.once('exit', removeOnExit);
  return {
    chromiumProfile: dir,
    args: [`--user-data-dir=${dir}`],
    async cleanup() {
      process.off('exit', removeOnExit);
      await rm(dir, { recursive: true, force: true });
    },
  };
}

/** Resolve an executable from the `PATH`, like `which`. */
export async function which(command: string): Promise<string | undefined> {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (!dir) continue;
    const candidate = join(dir, command);
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Not in this directory, keep looking.
    }
  }
}

function isWindowsPath(path: string): boolean {
  return /\.exe$/i.test(path) || /^\/mnt\/[a-z]\//i.test(path);
}

function isInside(path: string, dir: string): boolean {
  const rel = relative(dir, path);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}
