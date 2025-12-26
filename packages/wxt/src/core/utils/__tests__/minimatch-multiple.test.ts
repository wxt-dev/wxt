import { describe, it, expect } from 'vitest';
import { minimatchMultiple } from '../minimatch-multiple';

describe('minimatchMultiple', () => {
  it('should return false if the pattern array is undefined', () => {
    const patterns = undefined;
    const SEARCH = 'test.json';

    expect(minimatchMultiple(SEARCH, patterns)).toBe(false);
  });

  it('should return false if the pattern array is empty', () => {
    const patterns: string[] = [];
    const SEARCH = 'test.json';

    expect(minimatchMultiple(SEARCH, patterns)).toBe(false);
  });

  it('should return true if the pattern array contains a match', () => {
    const patterns = ['test.yml', 'test.json'];
    const SEARCH = 'test.json';

    expect(minimatchMultiple(SEARCH, patterns)).toBe(true);
  });

  it('should return false if the pattern array does not contain a match', () => {
    const patterns = ['test.yml', 'test.json'];
    const SEARCH = 'test.txt';

    expect(minimatchMultiple(SEARCH, patterns)).toBe(false);
  });

  it('should return false if the pattern matches a negative pattern', () => {
    const patterns = ['test.*', '!test.json'];
    const SEARCH = 'test.json';

    expect(minimatchMultiple(SEARCH, patterns)).toBe(false);
  });

  it('should return false if the pattern matches a negative pattern, regardless of order', () => {
    const patterns = ['!test.json', 'test.*'];
    const SEARCH = 'test.json';

    expect(minimatchMultiple(SEARCH, patterns)).toBe(false);
  });
});
