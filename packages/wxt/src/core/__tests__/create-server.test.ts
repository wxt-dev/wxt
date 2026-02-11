import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFileReloader } from '../create-server';
import { detectDevChanges, findEntrypoints, rebuild } from '../utils/building';
import {
  fakeBuildOutput,
  fakeDevServer,
  setFakeWxt,
} from '../utils/testing/fake-objects';

vi.mock('../utils/building', () => ({
  detectDevChanges: vi.fn(),
  findEntrypoints: vi.fn(),
  internalBuild: vi.fn(),
  rebuild: vi.fn(),
}));

describe('createFileReloader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setFakeWxt({
      config: {
        root: '/root',
        dev: {
          server: {
            watchDebounce: 100,
          },
        },
      },
    });
    vi.mocked(findEntrypoints).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should detect relevant file changes even when noisy file events happen first', async () => {
    const relevantFile = '/root/src/entrypoints/background.ts';
    const noisyProfileFile =
      '/root/private/.dev-profile/Default/Cache/Cache_Data/d573fa6484e43cf9_0';
    const currentOutput = fakeBuildOutput({
      steps: [],
      publicAssets: [],
    });
    const server = fakeDevServer({
      currentOutput,
      reloadExtension: vi.fn(),
    });

    vi.mocked(detectDevChanges).mockImplementation((fileChanges, output) => {
      if (fileChanges.includes(relevantFile)) {
        return {
          type: 'extension-reload',
          rebuildGroups: [],
          cachedOutput: output,
        };
      }
      return { type: 'no-change' };
    });
    vi.mocked(rebuild).mockResolvedValue({
      output: currentOutput,
      manifest: currentOutput.manifest,
      warnings: [],
    });

    const reloadOnChange = createFileReloader(server);

    const fixedFirst = reloadOnChange('change', noisyProfileFile);
    await vi.advanceTimersByTimeAsync(50);
    const fixedSecond = reloadOnChange('change', relevantFile);
    await vi.advanceTimersByTimeAsync(500);
    await Promise.all([fixedFirst, fixedSecond]);

    const seenFiles = vi
      .mocked(detectDevChanges)
      .mock.calls.flatMap(([fileChanges]) => fileChanges);

    expect(seenFiles).toContain(relevantFile);
    expect(server.reloadExtension).toBeCalledTimes(1);
  });
});
