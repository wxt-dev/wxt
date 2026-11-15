import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  vi,
} from 'bun:test';

import {
  fakeBackgroundEntrypoint,
  fakeBuildOutput,
  fakeDevServer,
  fakeOutputChunk,
  fakePopupEntrypoint,
  setFakeWxt,
} from '../../internal-utils/testing/fake-objects';
import { mocked } from '../../internal-utils/testing/mock';
import { createFileReloader } from '../file-reloader';
import { findEntrypoints } from '../find-entrypoints';
import { rebuild } from '../rebuild';

const actualFindEntrypoints = await import('../find-entrypoints');
mock.module('../find-entrypoints', () => ({
  ...actualFindEntrypoints,
  findEntrypoints: vi.fn(),
}));

const actualRebuild = await import('../rebuild');
mock.module('../rebuild', () => ({
  ...actualRebuild,
  rebuild: vi.fn(),
}));

afterAll(() => {
  mock.module('../find-entrypoints', () => actualFindEntrypoints);
  mock.module('../rebuild', () => actualRebuild);
});

/**
 * Bun's fake timers are synchronous, so advance in small steps and flush
 * microtasks in between to let code awaiting before it schedules timers run.
 */
async function advanceTimersByTimeAsync(ms: number) {
  const flush = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  };
  await flush();
  for (let elapsed = 0; elapsed < ms; elapsed += 10) {
    vi.advanceTimersByTime(10);
    await flush();
  }
}

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
    mocked(findEntrypoints).mockResolvedValue([]);
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

    mocked(rebuild).mockResolvedValue({
      output: currentOutput,
      manifest: currentOutput.manifest,
      warnings: [],
    });
    mocked(findEntrypoints).mockResolvedValue([backgroundEntrypoint]);

    const reloadOnChange = createFileReloader(server);

    const fixedFirst = reloadOnChange('change', noisyProfileFile);
    await advanceTimersByTimeAsync(50);
    const fixedSecond = reloadOnChange('change', relevantFile);
    await advanceTimersByTimeAsync(500);
    await Promise.all([fixedFirst, fixedSecond]);

    expect(rebuild).toBeCalledTimes(1);
    const [allEntrypoints, rebuiltGroups] = mocked(rebuild).mock.calls[0];
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

    mocked(findEntrypoints).mockResolvedValue([
      backgroundEntrypoint,
      popupEntrypoint,
    ]);
    mocked(rebuild).mockResolvedValue({
      output: currentOutput,
      manifest: currentOutput.manifest,
      warnings: [],
    });

    const reloadOnChange = createFileReloader(server);
    const trigger = reloadOnChange('add', newEntrypointFile);
    await advanceTimersByTimeAsync(500);
    await trigger;

    expect(rebuild).toBeCalledTimes(1);
    const [allEntrypoints, rebuiltGroups, cachedOutput] =
      mocked(rebuild).mock.calls[0];
    expect(allEntrypoints).toEqual([backgroundEntrypoint, popupEntrypoint]);
    expect(
      rebuiltGroups
        .flat()
        .some((entry) => entry.inputPath === newEntrypointFile),
    ).toBe(true);
    expect(cachedOutput).toEqual(currentOutput);
    expect(server.reloadExtension).toBeCalledTimes(1);
    expect(server.reloadContentScript).not.toBeCalled();
  });

  it('should ignore entrypoint directory changes when no new entrypoints are found', async () => {
    const backgroundFile = '/root/src/entrypoints/background.ts';
    const ignoredEntrypointDirFile = '/root/src/entrypoints/.DS_Store';
    const backgroundEntrypoint = fakeBackgroundEntrypoint({
      inputPath: backgroundFile,
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
      reloadContentScript: vi.fn(),
      reloadExtension: vi.fn(),
    });

    mocked(findEntrypoints).mockResolvedValue([backgroundEntrypoint]);

    const reloadOnChange = createFileReloader(server);
    const trigger = reloadOnChange('add', ignoredEntrypointDirFile);
    await advanceTimersByTimeAsync(500);
    await trigger;

    expect(rebuild).not.toBeCalled();
    expect(server.reloadContentScript).not.toBeCalled();
    expect(server.reloadExtension).not.toBeCalled();
  });
});
