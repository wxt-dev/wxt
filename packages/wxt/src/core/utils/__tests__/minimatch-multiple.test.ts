import { describe, it, expect } from 'vitest';
import { minimatchMultiple } from '../minimatch-multiple';

describe('minimatchMultiple', () => {
  it('should return false if the pattern array is undefined', () => {
    const patterns = undefined;
    const search = 'test.json';

    expect(minimatchMultiple(search, patterns)).toBe(false);
  });

  it('should return false if the pattern array is empty', () => {
    const patterns: string[] = [];
    const search = 'test.json';

    expect(minimatchMultiple(search, patterns)).toBe(false);
  });

  it('should return true if the pattern array contains a match', () => {
    const patterns = ['test.yml', 'test.json'];
    const search = 'test.json';

    expect(minimatchMultiple(search, patterns)).toBe(true);
  });

  it('should return false if the pattern array does not contain a match', () => {
    const patterns = ['test.yml', 'test.json'];
    const search = 'test.txt';

    expect(minimatchMultiple(search, patterns)).toBe(false);
  });

  it('should return false if the pattern matches a negative pattern', () => {
    const patterns = ['test.*', '!test.json'];
    const search = 'test.json';

    expect(minimatchMultiple(search, patterns)).toBe(false);
  });

  it('should return false if the pattern matches a negative pattern, regardless of order', () => {
    const patterns = ['!test.json', 'test.*'];
    const search = 'test.json';

    expect(minimatchMultiple(search, patterns)).toBe(false);
  });
});
