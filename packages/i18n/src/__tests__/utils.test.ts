import { describe, it, expect } from 'vitest';
import { ChromeMessage } from '../build';
import { applyChromeMessagePlaceholders, getSubstitionCount } from '../utils';

describe('Utils', () => {
  describe('applyChromeMessagePlaceholders', () => {
    it('should return the combined stirng', () => {
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

  describe('getSubstitionCount', () => {
    it('should return the last substution present in the message', () => {
      expect(getSubstitionCount('I like $1, but I like $2 better')).toBe(2);
    });

    it('should return 0 when no substitutions are present', () => {
      expect(getSubstitionCount('test')).toBe(0);
    });

    it('should ignore escaped dollar signs', () => {
      expect(getSubstitionCount('buy $1 now for $$2 dollars')).toBe(1);
    });

    it('should return the highest substitution when skipping numbers', () => {
      expect(getSubstitionCount('I like $1, but I like $8 better')).toBe(8);
    });

    it('should only allow up to 9 substitutions', () => {
      expect(getSubstitionCount('Hello $9')).toBe(9);
      expect(getSubstitionCount('Hello $10')).toBe(1);
    });
  });
});
