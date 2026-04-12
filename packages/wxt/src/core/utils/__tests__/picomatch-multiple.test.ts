import { describe, it, expect } from 'vitest';
import { picomatchMultiple } from '../picomatch-multiple';

describe('picomatchMultiple', () => {
  it('should return false if the pattern array is undefined', () => {
    const patterns = undefined;
    const search = 'test.json';

    expect(picomatchMultiple(search, patterns)).toBe(false);
  });

  it('should return false if the pattern array is empty', () => {
    const patterns: string[] = [];
    const search = 'test.json';

    expect(picomatchMultiple(search, patterns)).toBe(false);
  });

  it('should return true if the pattern array contains a match', () => {
    const patterns = ['test.yml', 'test.json'];
    const search = 'test.json';

    expect(picomatchMultiple(search, patterns)).toBe(true);
  });

  it('should return false if the pattern array does not contain a match', () => {
    const patterns = ['test.yml', 'test.json'];
    const search = 'test.txt';

    expect(picomatchMultiple(search, patterns)).toBe(false);
  });

  it('should return false if the pattern matches a negative pattern', () => {
    const patterns = ['test.*', '!test.json'];
    const search = 'test.json';

    expect(picomatchMultiple(search, patterns)).toBe(false);
  });

  it('should return false if the pattern matches a negative pattern, regardless of order', () => {
    const patterns = ['!test.json', 'test.*'];
    const search = 'test.json';

    expect(picomatchMultiple(search, patterns)).toBe(false);
  });

  it('should support extglob-like extension matching', () => {
    const patterns = ['content.[jt]s?(x)'];

    expect(picomatchMultiple('content.ts', patterns)).toBe(true);
    expect(picomatchMultiple('content.jsx', patterns)).toBe(true);
    expect(picomatchMultiple('content.css', patterns)).toBe(false);
  });

  it('should support nested paths', () => {
    const patterns = ['foo/**/*.ts'];

    expect(picomatchMultiple('foo/bar/baz.ts', patterns)).toBe(true);
    expect(picomatchMultiple('foo/bar/baz.js', patterns)).toBe(false);
  });

  it('should preserve include/exclude interaction used by zip filtering', () => {
    const include = ['special.txt'];
    const exclude = ['**/*.txt'];
    const search = 'special.txt';
    const shouldInclude =
      picomatchMultiple(search, include) || !picomatchMultiple(search, exclude);

    expect(shouldInclude).toBe(true);
  });
});
