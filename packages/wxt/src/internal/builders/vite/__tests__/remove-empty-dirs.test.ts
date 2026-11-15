import { afterAll, beforeEach, describe, expect, it, mock, vi } from 'bun:test';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { removeEmptyDirs } from '..';
import { mocked } from '../../../../internal-utils/testing/mock';

// `stat` is mocked (defaulting to the real implementation) so individual
// tests can override it to simulate a file disappearing mid-walk.
const actualFs = { ...(await import('node:fs/promises')) };
const realStat = actualFs.stat;
mock.module('node:fs/promises', () => ({
  ...actualFs,
  stat: vi.fn(realStat),
}));
afterAll(() => {
  mock.module('node:fs/promises', () => actualFs);
});

const mockedStat = mocked(stat);

describe('removeEmptyDirs', () => {
  beforeEach(() => {
    mockedStat.mockImplementation(realStat);
  });

  it('removes nested empty directories', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wxt-remove-empty-dirs-'));
    try {
      await mkdir(join(dir, 'a', 'b'), { recursive: true });
      await writeFile(join(dir, 'a', 'keep.txt'), 'x');

      await removeEmptyDirs(dir);

      await expect(realStat(join(dir, 'a', 'b'))).rejects.toThrow();
      await expect(realStat(join(dir, 'a', 'keep.txt'))).resolves.toBeDefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('does not throw when a file disappears between readdir and stat (a concurrent plugin write)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wxt-remove-empty-dirs-'));
    try {
      await mkdir(join(dir, 'inject-scripts'), { recursive: true });
      const disappearingFile = join(dir, 'inject-scripts', 'recorder.js');
      await writeFile(disappearingFile, 'x');

      mockedStat.mockImplementation((async (
        path: Parameters<typeof stat>[0],
        ...args: unknown[]
      ) => {
        if (path === disappearingFile) {
          const err: NodeJS.ErrnoException = new Error(
            'ENOENT: no such file or directory',
          );
          err.code = 'ENOENT';
          throw err;
        }
        return (realStat as (...a: unknown[]) => unknown)(path, ...args);
      }) as typeof stat);

      await expect(removeEmptyDirs(dir)).resolves.toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
