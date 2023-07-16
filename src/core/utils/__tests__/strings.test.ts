import { describe, expect, it } from 'vitest';
import { kebabCaseAlphanumeric } from '../strings';

describe('String utils', () => {
  describe('kebabCaseAlphanumeric', () => {
    it.each([
      ['HELLO', 'hello'],
      ['Hello, World!', 'hello-world'],
      ['hello123', 'hello123'],
      ['Hello World This Is A Test', 'hello-world-this-is-a-test'],
      ['Hello     World', 'hello-world'],
      ['hello-world', 'hello-world'], // Ensure hyphens are preserved
    ])('should convert "%s" to "%s"', (input, expected) => {
      expect(kebabCaseAlphanumeric(input)).toBe(expected);
    });
  });
});
