import { describe, it, expect } from 'vitest';
import { every } from '../arrays';

describe('Array Utils', () => {
  describe('every', () => {
    it('should return true when the array is empty', () => {
      expect(every([], () => false)).toBe(true);
    });

    it("should return true when all item predicate's return true", () => {
      expect(every([1, 1, 1], (item) => item === 1)).toBe(true);
    });

    it("should return false when a single item predicate's return false", () => {
      expect(every([1, 2, 1], (item) => item === 1)).toBe(false);
    });
  });
});
