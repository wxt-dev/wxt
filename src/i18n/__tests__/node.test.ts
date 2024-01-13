import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { convertMessagesFile } from '../node';

describe('I18n Node Utils', () => {
  describe('convertMessagesFile', () => {
    it("should return an object that can be written to the extension's _locales directory", async () => {
      const inputFile = resolve(__dirname, 'fixtures/messages-input.yml');
      const expectedFile = resolve(
        __dirname,
        'fixtures/messages-expected.json',
      );
      const expected = JSON.parse(await readFile(expectedFile, 'utf-8'));

      const actual = await convertMessagesFile(inputFile);

      expect(actual).toEqual(expected);
    });
  });
});
