/* eslint-disable no-control-regex */
import { describe, expect, it } from 'vitest';
import { escapeNonCharacterUnicode } from '../escape-unicode';

describe('escapeNonCharacterUnicode', () => {
  it('should escape non-characters in the BMP', () => {
    expect(escapeNonCharacterUnicode('\uFDD0\uFFFE\uFFFF')).toBe(
      '\\ufdd0\\ufffe\\uffff',
    );
  });

  it('should escape non-characters outside the BMP as surrogate pairs', () => {
    expect(escapeNonCharacterUnicode('\u{1FFFF}\u{10FFFE}')).toBe(
      '\\ud83f\\udfff\\udbff\\udffe',
    );
  });

  it('should produce output that round-trips to the original string', () => {
    const original = 'a\uFFFF\u{1FFFE}\u{10FFFF}b';
    const escaped = escapeNonCharacterUnicode(JSON.stringify(original));

    expect(escaped).toMatch(/^[\x00-\x7F]*$/);
    expect(JSON.parse(escaped)).toBe(original);
  });

  it('should not change other characters', () => {
    const text = 'const s = "h\u00e9llo \u{1F44B} \uFFFD";';
    expect(escapeNonCharacterUnicode(text)).toBe(text);
  });
});
