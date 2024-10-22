import { describe, it, expect } from 'vitest';
import { safeStringToNumber } from '../number';

describe('Number Utils', () => {
  describe('safeStringToNumber', () => {
    it.each([
      { arg: '1000', expected: 1000 },
      { arg: '', expected: 0 },
      { arg: '12abc', expected: null },
      { arg: undefined, expected: null },
    ])(
      'should be safely converted from string to number: safeStringToNumber($arg) -> $expected',
      ({ arg, expected }) => {
        expect(safeStringToNumber(arg)).toBe(expected);
      },
    );
  });
});
