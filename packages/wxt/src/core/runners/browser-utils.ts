import * as fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { wxt } from '../wxt';

/**
 * Check if a path looks like a Windows path (drive letter, UNC, or WSL mount).
 */
export function isWindowsPath(value: string): boolean {
  // Windows drive path: C:\...
  if (/^[a-zA-Z]:\\/.test(value)) return true;
  // WSL mounted drive: /mnt/c/...
  if (/^\/mnt\/[a-zA-Z]\//.test(value)) return true;
  // UNC-ish
  if (value.startsWith('\\\\')) return true;
  return false;
}

/**
 * Check if a file is executable.
 */
export async function isExecutable(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a binary path looks like a Google Chrome wrapper script.
 */
export function looksLikeGoogleChromeWrapper(filePath: string): boolean {
  const base = path.basename(filePath);
  if (base === 'google-chrome') return true;
  if (base === 'google-chrome-stable') return true;
  if (base === 'google-chrome-beta') return true;
  if (base === 'google-chrome-dev') return true;
  if (base === 'google-chrome-unstable') return true;
  if (filePath === '/opt/google/chrome/google-chrome') return true;
  return false;
}

/**
 * Resolve a profile directory path, making relative paths absolute.
 */
export function resolveProfilePath(
  projectRoot: string,
  profileDir: string,
): string {
  return path.isAbsolute(profileDir)
    ? profileDir
    : path.resolve(projectRoot, profileDir);
}

/**
 * In WSL with GUI, Chrome's wrapper scripts use bash process substitution which
 * closes extra FDs on exec, breaking `--remote-debugging-pipe` mode.
 * This resolves to the actual Chrome binary to keep the CDP pipe open.
 */
export async function resolveChromiumBinaryForRemoteDebuggingPipe({
  chromiumBinary,
  runningInWslWithGui,
  loggerPrefix = '',
}: {
  chromiumBinary: string | undefined;
  runningInWslWithGui: boolean;
  loggerPrefix?: string;
}): Promise<string | undefined> {
  if (!runningInWslWithGui) return chromiumBinary;

  const googleChromeRealBinary = '/opt/google/chrome/chrome';
  const hasRealGoogleChrome = await isExecutable(googleChromeRealBinary);

  if (chromiumBinary == null) {
    if (hasRealGoogleChrome) return googleChromeRealBinary;
    return chromiumBinary;
  }

  if (hasRealGoogleChrome && looksLikeGoogleChromeWrapper(chromiumBinary)) {
    wxt.logger.warn(
      `${loggerPrefix}Using "${googleChromeRealBinary}" instead of "${chromiumBinary}" in WSL with GUI to keep the CDP pipe open (avoids "Remote debugging pipe file descriptors are not open").`,
    );
    return googleChromeRealBinary;
  }

  // Handle cases where a wrapper was explicitly provided from a non-/opt path.
  if (looksLikeGoogleChromeWrapper(chromiumBinary)) {
    const resolved = await fs
      .realpath(chromiumBinary)
      .catch(() => chromiumBinary);
    const sibling = path.join(path.dirname(resolved), 'chrome');
    if (await isExecutable(sibling)) return sibling;
  }

  return chromiumBinary;
}

/**
 * Sanitize paths for WSL with GUI, filtering out Windows paths that won't work
 * with CDP pipes.
 */
export function sanitizePathForWslWithGui(
  value: string | undefined,
  label: string,
  runningInWslWithGui: boolean,
  loggerPrefix: string,
): string | undefined {
  if (!runningInWslWithGui || value == null) return value;
  if (isWindowsPath(value)) {
    wxt.logger.warn(
      `${loggerPrefix}Ignoring ${label}="${value}" in WSL with GUI. Windows paths/binaries are incompatible with CDP pipe extension install. Install a Linux browser in WSL and omit this setting.`,
    );
    return undefined;
  }
  return value;
}
