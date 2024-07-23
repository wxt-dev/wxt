import { describe, it, expect } from 'vitest';
import { every, some } from '../arrays';

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

  describe('some', () => {
    it('should return true if one value returns true', () => {
      const array = [1, 2, 3];
      const predicate = (item: number) => item === 2;

      expect(some(array, predicate)).toBe(true);
    });

    it('should return false if no values match', () => {
      const array = [1, 2, 3];
      const predicate = (item: number) => item === 4;

      expect(some(array, predicate)).toBe(false);
    });
  });
});
