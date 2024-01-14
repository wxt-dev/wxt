import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { convertMessagesToManifest, readMessagesFile } from '../node';

const inputFile = resolve(__dirname, 'fixtures/input.yml');
const messagesFile = resolve(__dirname, 'fixtures/messages.json');
const manifestFile = resolve(__dirname, 'fixtures/manifest.json');

describe('I18n Node Utils', () => {
  describe('readMessagesFile', () => {
    it('should return all available messages and metadata', async () => {
      const expected = JSON.parse(await readFile(messagesFile, 'utf-8'));
      const actual = await readMessagesFile(inputFile);
      expect(actual).toEqual(expected);
    });
  });

  describe('convertMessagesToManifest', () => {
    it('should return all available messages and metadata', async () => {
      const input = JSON.parse(await readFile(messagesFile, 'utf-8'));
      const expected = JSON.parse(await readFile(manifestFile, 'utf-8'));

      const actual = convertMessagesToManifest(input);

      expect(actual).toEqual(expected);
    });
  });
});
