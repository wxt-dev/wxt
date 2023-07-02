import { describe, expect, it } from 'vitest';
import { DevModeChange, detectDevChanges } from '../detectDevChanges';
import {
  fakeBackgroundEntrypoint,
  fakeContentScriptEntrypoint,
  fakeFile,
  fakeManifest,
  fakeRollupOutputAsset,
  fakeRollupOutputChunk,
} from '../../../testing/fake-objects';
import { BuildOutput, BuildStepOutput } from '../../types';

describe('Detect Dev Changes', () => {
  describe('No changes', () => {
    it("should return 'no-change' when a build hasn't finished", () => {
      const actual = detectDevChanges(
        [['unknown', '/path/to/file.ts']],
        undefined,
      );

      expect(actual).toEqual({ type: 'no-change' });
    });

    it("should return 'no-change' when the changed file isn't used by any of the entrypoints", () => {
      const change: [string, string] = ['unknown', '/some/path.ts'];
      const currentOutput: BuildOutput = {
        manifest: fakeManifest(),
        publicAssets: [],
        steps: [
          {
            entrypoints: fakeContentScriptEntrypoint(),
            chunks: [fakeRollupOutputChunk(), fakeRollupOutputChunk()],
          },
          {
            entrypoints: fakeContentScriptEntrypoint(),
            chunks: [
              fakeRollupOutputChunk(),
              fakeRollupOutputChunk(),
              fakeRollupOutputChunk(),
            ],
          },
        ],
      };

      const actual = detectDevChanges([change], currentOutput);

      expect(actual).toEqual({ type: 'no-change' });
    });
  });

  describe('Public Assets', () => {
    it("should return 'extension-reload' without any groups to rebuild when the changed file is a public asset", () => {
      const change: [string, string] = [
        'unknown',
        '/root/src/public/image.svg',
      ];
      const asset1 = fakeRollupOutputAsset({
        fileName: 'image.svg',
      });
      const asset2 = fakeRollupOutputAsset({
        fileName: 'some-other-image.svg',
      });
      const currentOutput: BuildOutput = {
        manifest: fakeManifest(),
        publicAssets: [asset1, asset2],
        steps: [],
      };
      const expected: DevModeChange = {
        type: 'extension-reload',
        rebuildGroups: [],
        cachedOutput: {
          ...currentOutput,
          publicAssets: [asset2],
        },
      };

      const actual = detectDevChanges([change], currentOutput);

      expect(actual).toEqual(expected);
    });
  });

  describe('Background', () => {
    it("should rebuild the background and reload the extension when the changed file in it's chunks' `moduleIds` field", () => {
      const changedPath = '/root/utils/shared.ts';
      const contentScript = fakeContentScriptEntrypoint({
        inputPath: '/root/overlay.content.ts',
      });
      const background = fakeBackgroundEntrypoint({
        inputPath: '/root/background.ts',
      });

      const step1: BuildStepOutput = {
        entrypoints: contentScript,
        chunks: [
          fakeRollupOutputChunk({
            moduleIds: [fakeFile(), fakeFile()],
          }),
        ],
      };
      const step2: BuildStepOutput = {
        entrypoints: background,
        chunks: [
          fakeRollupOutputChunk({
            moduleIds: [fakeFile(), changedPath, fakeFile()],
          }),
        ],
      };

      const currentOutput: BuildOutput = {
        manifest: fakeManifest(),
        publicAssets: [],
        steps: [step1, step2],
      };
      const expected: DevModeChange = {
        type: 'extension-reload',
        cachedOutput: {
          ...currentOutput,
          steps: [step1],
        },
        rebuildGroups: [background],
      };

      const actual = detectDevChanges(
        [['unknown', changedPath]],
        currentOutput,
      );

      expect(actual).toEqual(expected);
    });
  });
});
