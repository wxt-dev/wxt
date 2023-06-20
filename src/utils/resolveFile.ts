import p from 'node:path';
import fs from 'fs-extra';

/**
 * Given a root and path, resolve absolute path to the file.
 *
 * - If the path is absolute, return the path.
 * - If the file exists at `path.resolve(root, ...path)`, return that path
 * - If the file exists at `path.resolve(...path)`, return that path
 * - If the file doesn't exist, return `undefined`.
 *
 * Any files in the root directory with the specified path take precidence over files in the CWD
 * with the same path.
 */
export async function resolveFile(
  root: string,
  path: string,
): Promise<string | undefined> {
  const rootPath = p.resolve(root, path);
  if (await fs.exists(rootPath)) return rootPath;

  const cwdPath = p.resolve(process.cwd(), path);
  if (await fs.exists(cwdPath)) return cwdPath;
}
