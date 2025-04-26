import { describe, it, expect } from 'vitest';
import { ChromeMessage } from '../build';
import {
  applyChromeMessagePlaceholders,
  getSubstitutionCount,
  standardizeLocale,
} from '../utils';

describe('Utils', () => {
  describe('applyChromeMessagePlaceholders', () => {
    it('should return the combined string', () => {
      const input = {
        message: 'Hello $username$, welcome to $appName$',
        placeholders: {
          username: { content: '$1' },
          appName: { content: 'Example' },
        },
      } satisfies ChromeMessage;
      const expected = input.message
        .replace('$username$', input.placeholders.username.content)
        .replace('$appName$', input.placeholders.appName.content);

      const actual = applyChromeMessagePlaceholders(input);

      expect(actual).toBe(expected);
    });

    it('should ignore the case', () => {
      const input = {
        message: 'Hello $USERNAME$, welcome $username$',
        placeholders: {
          username: { content: '$1' },
        },
      } satisfies ChromeMessage;
      const expected = input.message
        .replace('$USERNAME$', input.placeholders.username.content)
        .replace('$username$', input.placeholders.username.content);

      const actual = applyChromeMessagePlaceholders(input);

      expect(actual).toBe(expected);
    });
  });

  describe('getSubstitutionCount', () => {
    it('should return the last substution present in the message', () => {
      expect(getSubstitutionCount('I like $1, but I like $2 better')).toBe(2);
    });

    it('should return 0 when no substitutions are present', () => {
      expect(getSubstitutionCount('test')).toBe(0);
    });

    it('should ignore escaped dollar signs', () => {
      expect(getSubstitutionCount('buy $1 now for $$2 dollars')).toBe(1);
    });

    it('should return the highest substitution when skipping numbers', () => {
      expect(getSubstitutionCount('I like $1, but I like $8 better')).toBe(8);
    });

    it('should only allow up to 9 substitutions', () => {
      expect(getSubstitutionCount('Hello $9')).toBe(9);
      expect(getSubstitutionCount('Hello $10')).toBe(1);
    });
  });

  describe('standardizeLocale', () => {
    it('should convert two-letter locale codes to lowercase', () => {
      expect(standardizeLocale('en')).toEqual('en');
      expect(standardizeLocale('EN')).toEqual('en');
    });

    it('should convert locale code extensions to uppercase', () => {
      expect(standardizeLocale('en_US')).toEqual('en_US');
      expect(standardizeLocale('en_us')).toEqual('en_US');
      expect(standardizeLocale('es_419')).toEqual('es_419');
    });

    it('should convert dashes to underscores', () => {
      expect(standardizeLocale('en_US')).toEqual('en_US');
      expect(standardizeLocale('en-US')).toEqual('en_US');
    });

    it('should return the input string as-is for unknown formats', () => {
      expect(standardizeLocale('en_USSS')).toEqual('en_USSS');
      expect(standardizeLocale('en-')).toEqual('en-');
      expect(standardizeLocale('------')).toEqual('------');
      expect(standardizeLocale('test')).toEqual('test');
      expect(standardizeLocale('hello-world')).toEqual('hello-world');
    });
  });
});
