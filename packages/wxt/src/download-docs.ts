import path from 'node:path';
import { styleText } from 'node:util';

import { consola } from 'consola';
import { downloadTemplate } from 'giget';

import { pathExists } from './internal-utils/fs-utils';
import { version } from './version';

const REPO = 'wxt-dev/wxt';

export interface DownloadDocsOptions {
  /** Project root. Defaults to `process.cwd()`. */
  root?: string;
  /**
   * Base directory for versioned docs. Relative paths resolve against `root`.
   * Docs are written to `<outDir>/v<version>/`. Defaults to
   * `<root>/.wxt/docs`.
   */
  outDir?: string;
  /** Redownload even if docs for this version already exist. */
  force?: boolean;
}

/**
 * Download the prose docs that match the installed WXT version into
 * `.wxt/docs/v<version>` (or `<outDir>/v<version>`).
 *
 * @example
 *   await downloadDocs();
 *   await downloadDocs({ outDir: 'tmp/wxt-docs', force: true });
 */
export async function downloadDocs(
  options: DownloadDocsOptions = {},
): Promise<void> {
  const root = path.resolve(options.root ?? process.cwd());
  const docsBase = options.outDir
    ? path.resolve(root, options.outDir)
    : path.join(root, '.wxt', 'docs');
  const outDir = path.join(docsBase, `v${version}`);
  const force = options.force ?? false;
  const tag = `wxt-v${version}`;

  if (!force && (await pathExists(outDir))) {
    consola.info(
      `Docs for WXT ${version} already downloaded at ${styleText('cyan', outDir)}`,
    );
    return;
  }

  consola.info(`Downloading docs for WXT ${version} (${tag})...`);

  try {
    await downloadTemplate(`gh:${REPO}/docs#${tag}`, {
      dir: outDir,
      force: true,
    });
  } catch (err) {
    throw new Error(
      `Failed to download docs for ${tag}. The tag may not exist if you're on an unreleased or local build of WXT.`,
      { cause: err },
    );
  }

  consola.success(`Docs downloaded to ${styleText('cyan', outDir)}`);
}
