import { describe, expect, it } from 'vitest';
import { DevModeChange, detectDevChanges } from '../detectDevChanges';
import {
  fakeBackgroundEntrypoint,
  fakeContentScriptEntrypoint,
  fakeFile,
  fakeGenericEntrypoint,
  fakeManifest,
  fakeOptionsEntrypoint,
  fakePopupEntrypoint,
  fakeRollupOutputAsset,
  fakeRollupOutputChunk,
} from '../../../testing-utils/fake-objects';
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

  describe('HTML Pages', () => {
    it('should rebuild then reload only the effected pages', async () => {
      const changedPath = '/root/page1/index.html';
      const htmlPage1 = fakePopupEntrypoint({
        inputPath: changedPath,
      });
      const htmlPage2 = fakeOptionsEntrypoint({
        inputPath: '/root/page2.html',
      });
      const htmlPage3 = fakeGenericEntrypoint({
        type: 'sandbox',
        inputPath: '/root/page3.html',
      });

      const step1: BuildStepOutput = {
        entrypoints: [htmlPage1, htmlPage2],
        chunks: [
          fakeRollupOutputChunk({
            moduleIds: [fakeFile(), changedPath],
          }),
        ],
      };
      const step2: BuildStepOutput = {
        entrypoints: [htmlPage3],
        chunks: [
          fakeRollupOutputChunk({
            moduleIds: [fakeFile(), fakeFile(), fakeFile()],
          }),
        ],
      };

      const currentOutput: BuildOutput = {
        manifest: fakeManifest(),
        publicAssets: [],
        steps: [step1, step2],
      };
      const expected: DevModeChange = {
        type: 'html-reload',
        cachedOutput: {
          ...currentOutput,
          steps: [step2],
        },
        rebuildGroups: [[htmlPage1, htmlPage2]],
      };

      const actual = detectDevChanges(
        [['unknown', changedPath]],
        currentOutput,
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('Content Scripts', () => {
    it('should rebuild then reload only the effected content scripts', async () => {
      const changedPath = '/root/utils/shared.ts';
      const script1 = fakeContentScriptEntrypoint({
        inputPath: '/root/overlay1.content/index.ts',
      });
      const script2 = fakeContentScriptEntrypoint({
        inputPath: '/root/overlay2.ts',
      });
      const script3 = fakeContentScriptEntrypoint({
        inputPath: '/root/overlay3.content/index.ts',
      });

      const step1: BuildStepOutput = {
        entrypoints: script1,
        chunks: [
          fakeRollupOutputChunk({
            moduleIds: [fakeFile(), changedPath],
          }),
        ],
      };
      const step2: BuildStepOutput = {
        entrypoints: script2,
        chunks: [
          fakeRollupOutputChunk({
            moduleIds: [fakeFile(), fakeFile(), fakeFile()],
          }),
        ],
      };
      const step3: BuildStepOutput = {
        entrypoints: script3,
        chunks: [
          fakeRollupOutputChunk({
            moduleIds: [changedPath, fakeFile(), fakeFile()],
          }),
        ],
      };

      const currentOutput: BuildOutput = {
        manifest: fakeManifest(),
        publicAssets: [],
        steps: [step1, step2, step3],
      };
      const expected: DevModeChange = {
        type: 'content-script-reload',
        cachedOutput: {
          ...currentOutput,
          steps: [step2],
        },
        changedSteps: [step1, step3],
        rebuildGroups: [script1, script3],
      };

      const actual = detectDevChanges(
        [['unknown', changedPath]],
        currentOutput,
      );

      expect(actual).toEqual(expected);
    });
  });
});
