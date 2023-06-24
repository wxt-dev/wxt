import fs, { ensureDir } from 'fs-extra';
import { FsCache } from '../types';
import { dirname, resolve } from 'path';

/**
 * A basic file system cache stored at `<srcDir>/.exvite/cache/<key>`. Just caches a string in a
 * file for the given key.
 *
 * @param srcDir Absolute path to source directory. See `InternalConfig.srcDir`
 */
export function createFsCache(exviteDir: string): FsCache {
  const getPath = (key: string) =>
    resolve(exviteDir, 'cache', encodeURIComponent(key));

  return {
    async set(key: string, value: string): Promise<void> {
      const path = getPath(key);
      await ensureDir(dirname(path));
      await fs.writeFile(path, value, 'utf-8');
    },
    async get(key: string): Promise<string | undefined> {
      const path = getPath(key);
      try {
        return await fs.readFile(path, 'utf-8');
      } catch {
        return undefined;
      }
    },
  };
}
