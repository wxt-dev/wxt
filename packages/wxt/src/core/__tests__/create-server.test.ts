import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFileReloader } from '../utils/create-file-reloader';
import { findEntrypoints, rebuild } from '../utils/building';
import {
  fakeBackgroundEntrypoint,
  fakeBuildOutput,
  fakeDevServer,
  fakeOutputChunk,
  fakePopupEntrypoint,
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
        entrypointsDir: '/root/src/entrypoints',
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
      skipped: false,
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
    vi.mocked(findEntrypoints).mockResolvedValue([backgroundEntrypoint]);

    const reloadOnChange = createFileReloader(server);

    const fixedFirst = reloadOnChange('change', noisyProfileFile);
    await vi.advanceTimersByTimeAsync(50);
    const fixedSecond = reloadOnChange('change', relevantFile);
    await vi.advanceTimersByTimeAsync(500);
    await Promise.all([fixedFirst, fixedSecond]);

    expect(rebuild).toBeCalledTimes(1);
    const [allEntrypoints, rebuiltGroups] = vi.mocked(rebuild).mock.calls[0];
    expect(
      allEntrypoints.some((entry) => entry.inputPath === relevantFile),
    ).toBe(true);
    expect(
      rebuiltGroups.flat().some((entry) => entry.inputPath === relevantFile),
    ).toBe(true);
    expect(server.reloadExtension).toBeCalledTimes(1);
  });

  it('should rebuild and reload extension when a new entrypoint is added', async () => {
    const backgroundFile = '/root/src/entrypoints/background.ts';
    const newEntrypointFile = '/root/src/entrypoints/popup.html';
    const backgroundEntrypoint = fakeBackgroundEntrypoint({
      inputPath: backgroundFile,
      skipped: false,
    });
    const popupEntrypoint = fakePopupEntrypoint({
      inputPath: newEntrypointFile,
      skipped: false,
    });
    const currentOutput = fakeBuildOutput({
      steps: [
        {
          entrypoints: backgroundEntrypoint,
          chunks: [fakeOutputChunk({ moduleIds: [backgroundFile] })],
        },
      ],
      publicAssets: [],
    });
    const server = fakeDevServer({
      currentOutput,
      reloadExtension: vi.fn(),
    });

    vi.mocked(findEntrypoints).mockResolvedValue([
      backgroundEntrypoint,
      popupEntrypoint,
    ]);
    vi.mocked(rebuild).mockResolvedValue({
      output: currentOutput,
      manifest: currentOutput.manifest,
      warnings: [],
    });

    const reloadOnChange = createFileReloader(server);
    const trigger = reloadOnChange('add', newEntrypointFile);
    await vi.advanceTimersByTimeAsync(500);
    await trigger;

    expect(rebuild).toBeCalledTimes(1);
    const [allEntrypoints, rebuiltGroups, cachedOutput] =
      vi.mocked(rebuild).mock.calls[0];
    expect(allEntrypoints).toEqual([backgroundEntrypoint, popupEntrypoint]);
    expect(
      rebuiltGroups
        .flat()
        .some((entry) => entry.inputPath === newEntrypointFile),
    ).toBe(true);
    expect(cachedOutput).toEqual(currentOutput);
    expect(server.reloadExtension).toBeCalledTimes(1);
  });
});
