import { describe, it, expect } from 'vitest';
import { getEntrypointName, getEntrypointOutputFile } from '../entrypoints';
import { Entrypoint } from '../../types';
import { resolve } from 'path';

describe('Entrypoint Utils', () => {
  describe('getEntrypointName', () => {
    const entrypointsDir = '/entrypoints';

    it.each<[string, string]>([
      [resolve(entrypointsDir, 'popup.html'), 'popup'],
      [resolve(entrypointsDir, 'options/index.html'), 'options'],
      [resolve(entrypointsDir, 'example.sandbox/index.html'), 'example'],
      [resolve(entrypointsDir, 'some.content/index.ts'), 'some'],
      [resolve(entrypointsDir, 'overlay.content.ts'), 'overlay'],
    ])('should convert %s to %s', (inputPath, expected) => {
      const actual = getEntrypointName(entrypointsDir, inputPath);
      expect(actual).toBe(expected);
    });
  });

  describe('getEntrypointOutputFile', () => {
    const outDir = '/.output';
    it.each<{ expected: string; name: string; ext: string; outputDir: string }>(
      [
        {
          name: 'popup',
          ext: '.html',
          outputDir: outDir,
          expected: resolve(outDir, 'popup.html'),
        },
        {
          name: 'overlay',
          ext: '.ts',
          outputDir: resolve(outDir, 'content-scripts'),
          expected: resolve(outDir, 'content-scripts', 'overlay.ts'),
        },
      ],
    )('should return %s', ({ name, ext, expected, outputDir }) => {
      const entrypoint: Entrypoint = {
        type: 'unlisted-page',
        inputPath: '...',
        name,
        outputDir,
        options: {},
      };

      const actual = getEntrypointOutputFile(entrypoint, ext);
      expect(actual).toBe(expected);
    });
  });
});
