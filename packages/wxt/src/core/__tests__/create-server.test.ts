import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFileReloader } from '../create-server';
import { findEntrypoints, rebuild } from '../utils/building';
import {
  fakeBackgroundEntrypoint,
  fakeBuildOutput,
  fakeDevServer,
  fakeOutputChunk,
  setFakeWxt,
} from '../utils/testing/fake-objects';

vi.mock('../utils/building', async () => {
  const actual =
    await vi.importActual<typeof import('../utils/building')>(
      '../utils/building',
    );
  return {
    ...actual,
    findEntrypoints: vi.fn(),
    rebuild: vi.fn(),
  };
});

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
    const backgroundEntrypoint = fakeBackgroundEntrypoint({
      inputPath: relevantFile,
    });
    const currentOutput = fakeBuildOutput({
      steps: [
        {
          entrypoints: backgroundEntrypoint,
          chunks: [fakeOutputChunk({ moduleIds: [relevantFile] })],
        },
      ],
      publicAssets: [],
    });
    const server = fakeDevServer({
      currentOutput,
      reloadExtension: vi.fn(),
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

    expect(rebuild).toBeCalledTimes(1);
    expect(rebuild).toBeCalledWith(
      [],
      [expect.objectContaining({ inputPath: relevantFile })],
      expect.anything(),
    );
    expect(server.reloadExtension).toBeCalledTimes(1);
  });
});
