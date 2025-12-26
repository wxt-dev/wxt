import { describe, it, expect } from 'vitest';
import {
  getEntrypointName,
  getEntrypointOutputFile,
  resolvePerBrowserOption,
} from '../entrypoints';
import { Entrypoint } from '../../../types';
import { resolve } from 'path';

describe('Entrypoint Utils', () => {
  describe('getEntrypointName', () => {
    const ENTRYPOINTS_DIR = '/entrypoints';

    it.each<[string, string]>([
      [resolve(ENTRYPOINTS_DIR, 'popup.html'), 'popup'],
      [resolve(ENTRYPOINTS_DIR, 'options/index.html'), 'options'],
      [resolve(ENTRYPOINTS_DIR, 'example.sandbox/index.html'), 'example'],
      [resolve(ENTRYPOINTS_DIR, 'some.content/index.ts'), 'some'],
      [resolve(ENTRYPOINTS_DIR, 'overlay.content.ts'), 'overlay'],
    ])('should convert %s to %s', (inputPath, expected) => {
      const actual = getEntrypointName(ENTRYPOINTS_DIR, inputPath);
      expect(actual).toBe(expected);
    });
  });

  describe('getEntrypointOutputFile', () => {
    const OUT_DIR = '/.output';

    it.each<{ expected: string; name: string; ext: string; outputDir: string }>(
      [
        {
          name: 'popup',
          ext: '.html',
          outputDir: OUT_DIR,
          expected: resolve(OUT_DIR, 'popup.html'),
        },
        {
          name: 'overlay',
          ext: '.ts',
          outputDir: resolve(OUT_DIR, 'content-scripts'),
          expected: resolve(OUT_DIR, 'content-scripts', 'overlay.ts'),
        },
      ],
    )('should return %s', ({ name, ext, expected, outputDir }) => {
      const entrypoint: Entrypoint = {
        type: 'unlisted-page',
        inputPath: '...',
        name,
        outputDir,
        options: {},
        skipped: false,
      };

      const actual = getEntrypointOutputFile(entrypoint, ext);
      expect(actual).toBe(expected);
    });
  });

  describe('resolvePerBrowserOption', () => {
    it('should return the value directly', () => {
      expect(resolvePerBrowserOption('some-string', '')).toEqual('some-string');
      expect(resolvePerBrowserOption(false, '')).toEqual(false);
      expect(resolvePerBrowserOption([1], '')).toEqual([1]);
      expect(resolvePerBrowserOption(['string'], '')).toEqual(['string']);
    });

    it('should return the value for the specific browser', () => {
      expect(resolvePerBrowserOption({ a: 'one', b: 'two' }, 'a')).toEqual(
        'one',
      );
      expect(resolvePerBrowserOption({ c: ['one'], d: ['two'] }, 'c')).toEqual([
        'one',
      ]);
      expect(resolvePerBrowserOption({ c: false, d: true }, 'e')).toEqual(
        undefined,
      );
    });
  });
});
