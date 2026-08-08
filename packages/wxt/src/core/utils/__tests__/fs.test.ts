import { describe, it, expect } from 'vitest';
import { getBytesDisplay } from '../fs';

describe('FS Utils', () => {
  describe('getBytesDisplay', () => {
    it.each([
      [123, '123 B'],
      [999, '999 B'],
      [1000, '1.00 kB'],
      [3419, '3.42 kB'],
      [999994, '999.99 kB'],
      [999995, '1.00 MB'],
      [123456789, '123.46 MB'],
    ])('Converts %d bytes to "%s"', (bytes, expected) => {
      expect(getBytesDisplay(bytes)).toBe(expected);
    });
  });
});
