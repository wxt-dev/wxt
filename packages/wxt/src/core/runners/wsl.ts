import { ExtensionRunner } from '../../types';
import { access, constants, open, realpath } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { delimiter, join, relative } from 'node:path';
import { wxt } from '../wxt';

export type WslRunnerReason = 'chromium' | 'snap-firefox';

/**
 * The WSL runner just logs a warning message, for the browsers `web-ext` can't
 * open in WSL.
 */
export function createWslRunner(reason: WslRunnerReason): ExtensionRunner {
  return {
    async openBrowser() {
      const outDir = relative(process.cwd(), wxt.config.outDir);
      wxt.logger.warn(
        reason === 'chromium'
          ? `Cannot open Chromium browsers when using WSL. Load "${outDir}" as an unpacked extension manually, or use Firefox (\`wxt -b firefox\`). See https://github.com/GoogleChrome/chrome-launcher/issues/334`
          : `Cannot open the Snap version of Firefox when using WSL, its sandbox can't read the temporary profile in "${tmpdir()}". Load "${outDir}" as an unpacked extension manually, install a non-Snap Firefox (https://support.mozilla.org/kb/install-firefox-linux) and set \`binaries.firefox\` in your \`web-ext.config.ts\`, or set \`TMPDIR\` to a directory inside your home directory.`,
      );
    },
  };
}

/**
 * Returns true when the Firefox binary `web-ext` would launch is the Snap build
 * and it would fail to load `web-ext`'s temporary profile. The Snap sandbox
 * can't read the system temp directory, only the user's home directory.
 */
export async function isUnusableSnapFirefox(
  binary: string | undefined,
): Promise<boolean> {
  if (isInside(tmpdir(), homedir())) return false;

  const path = binary ?? (await which('firefox'));
  if (!path) return false;

  try {
    const resolved = await realpath(path);
    if (resolved.includes('/snap/')) return true;

    // Ubuntu ships `/usr/bin/firefox` as a shell script that runs the Snap,
    // while a non-Snap Firefox is an ELF binary.
    const file = await open(resolved);
    try {
      const { buffer, bytesRead } = await file.read({
        buffer: Buffer.alloc(4096),
      });
      const head = buffer.subarray(0, bytesRead);
      if (head.subarray(0, 4).toString('latin1') === '\x7fELF') return false;
      return head.toString('utf8').includes('/snap/bin/firefox');
    } finally {
      await file.close();
    }
  } catch {
    return false;
  }
}

function isInside(path: string, dir: string): boolean {
  const rel = relative(dir, path);
  return !rel.startsWith('..') && !rel.startsWith('/');
}

/** Resolve an executable from `PATH`, like `which`. */
async function which(command: string): Promise<string | undefined> {
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
