import { describe, expect, it } from 'vitest';
import { normalizePath } from '../paths';

describe('Path Utils', () => {
  describe('normalizePath', () => {
    it.each([
      // Relative paths
      ['../test.sh', '../test.sh'],
      ['..\\test.sh', '../test.sh'],
      ['test.png', 'test.png'],
      // Absolute paths
      ['C:\\\\path\\to\\file', 'C:/path/to/file'],
      ['/path/to/file', '/path/to/file'],
      // Strip trailing slash
      ['C:\\\\path\\to\\folder\\', 'C:/path/to/folder'],
      ['/path/to/folder/', '/path/to/folder'],
      // Dedupe slashes
      ['path\\\\\\file', 'path/file'],
      ['path//file', 'path/file'],
    ])('should normalize "%s" to "%s"', (input, expected) => {
      expect(normalizePath(input)).toBe(expected);
    });
  });
});
