import fs, { ensureDir } from 'fs-extra';
import { FsCache } from '../types';
import { dirname, resolve } from 'path';
import { writeFileIfDifferent } from './fs';

/**
 * A basic file system cache stored at `<srcDir>/.wxt/cache/<key>`. Just caches a string in a
 * file for the given key.
 *
 * @param srcDir Absolute path to source directory. See `InternalConfig.srcDir`
 */
export function createFsCache(wxtDir: string): FsCache {
  const getPath = (key: string) =>
    resolve(wxtDir, 'cache', encodeURIComponent(key));

  return {
    async set(key: string, value: string): Promise<void> {
      const path = getPath(key);
      await ensureDir(dirname(path));
      await writeFileIfDifferent(path, value);
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
