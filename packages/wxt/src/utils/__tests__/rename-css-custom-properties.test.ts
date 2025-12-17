import { describe, it, expect } from 'vitest';
import { renameCssCustomProperties } from '../rename-css-custom-properties';

describe('renameCssCustomProperties', () => {
  const defaultOptions = {
    fromPrefix: '--tw-',
    toPrefix: '--wxt-tw-',
  };

  describe('@property rules', () => {
    it('should rename @property rule names', () => {
      const css = `@property --tw-gradient-from {
  syntax: "<color>";
  inherits: false;
  initial-value: #0000;
}`;
      const expected = `@property --wxt-tw-gradient-from {
  syntax: "<color>";
  inherits: false;
  initial-value: #0000;
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should rename multiple @property rules', () => {
      const css = `@property --tw-gradient-from {
  syntax: "<color>";
}
@property --tw-gradient-to {
  syntax: "<color>";
}`;
      const expected = `@property --wxt-tw-gradient-from {
  syntax: "<color>";
}
@property --wxt-tw-gradient-to {
  syntax: "<color>";
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should not rename @property rules with non-matching prefix', () => {
      const css = `@property --other-prop {
  syntax: "*";
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(css);
    });
  });

  describe('property declarations', () => {
    it('should rename property declarations', () => {
      const css = `.class {
  --tw-gradient-from: #ff0000;
}`;
      const expected = `.class {
  --wxt-tw-gradient-from: #ff0000;
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should rename multiple property declarations', () => {
      const css = `.class {
  --tw-gradient-from: #ff0000;
  --tw-gradient-to: #0000ff;
}`;
      const expected = `.class {
  --wxt-tw-gradient-from: #ff0000;
  --wxt-tw-gradient-to: #0000ff;
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should not rename declarations with non-matching prefix', () => {
      const css = `.class {
  --other-prop: value;
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(css);
    });
  });

  describe('var() references', () => {
    it('should rename var() references', () => {
      const css = `.class {
  background: var(--tw-gradient-from);
}`;
      const expected = `.class {
  background: var(--wxt-tw-gradient-from);
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should rename var() with fallback values', () => {
      const css = `.class {
  background: var(--tw-gradient-from, #000);
}`;
      const expected = `.class {
  background: var(--wxt-tw-gradient-from, #000);
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should rename nested var() references', () => {
      const css = `.class {
  background: var(--tw-gradient-from, var(--tw-gradient-to));
}`;
      const expected = `.class {
  background: var(--wxt-tw-gradient-from, var(--wxt-tw-gradient-to));
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should rename var() inside calc()', () => {
      const css = `.class {
  width: calc(var(--tw-spacing) * 2);
}`;
      const expected = `.class {
  width: calc(var(--wxt-tw-spacing) * 2);
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should not rename var() with non-matching prefix', () => {
      const css = `.class {
  background: var(--other-prop);
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(css);
    });
  });

  describe('combined cases', () => {
    it('should rename all occurrences in a complete CSS snippet', () => {
      const css = `@property --tw-gradient-from {
  syntax: "<color>";
  inherits: false;
  initial-value: #0000;
}

.from-red-500 {
  --tw-gradient-from: #ef4444;
}

.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to));
}`;

      const expected = `@property --wxt-tw-gradient-from {
  syntax: "<color>";
  inherits: false;
  initial-value: #0000;
}

.from-red-500 {
  --wxt-tw-gradient-from: #ef4444;
}

.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--wxt-tw-gradient-from), var(--wxt-tw-gradient-to));
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should handle minified CSS', () => {
      const css = `@property --tw-shadow{syntax:"*";inherits:false}.class{--tw-shadow:0 0 #0000;box-shadow:var(--tw-shadow)}`;
      const expected = `@property --wxt-tw-shadow{syntax:"*";inherits:false}.class{--wxt-tw-shadow:0 0 #0000;box-shadow:var(--wxt-tw-shadow)}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });
  });

  describe('custom prefixes', () => {
    it('should work with custom fromPrefix and toPrefix', () => {
      const css = `.class {
  --custom-prop: value;
  background: var(--custom-prop);
}`;
      const expected = `.class {
  --my-custom-prop: value;
  background: var(--my-custom-prop);
}`;

      expect(
        renameCssCustomProperties(css, {
          fromPrefix: '--custom-',
          toPrefix: '--my-custom-',
        }),
      ).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should handle empty CSS string', () => {
      expect(renameCssCustomProperties('', defaultOptions)).toBe('');
    });

    it('should handle CSS without any custom properties', () => {
      const css = `.class { color: red; }`;
      expect(renameCssCustomProperties(css, defaultOptions)).toBe(css);
    });

    it('should preserve whitespace in var() references', () => {
      const css = `.class {
  background: var( --tw-gradient-from );
}`;
      const expected = `.class {
  background: var( --wxt-tw-gradient-from );
}`;

      expect(renameCssCustomProperties(css, defaultOptions)).toBe(expected);
    });

    it('should return original CSS when both fromPrefix and toPrefix are undefined', () => {
      const css = `.class { --tw-prop: value; }`;
      expect(renameCssCustomProperties(css, {})).toBe(css);
    });

    it('should prepend toPrefix to all custom properties when fromPrefix is undefined', () => {
      const css = `.class { --prop: value; background: var(--prop); }`;
      const expected = `.class { --wxt-prop: value; background: var(--wxt-prop); }`;
      expect(renameCssCustomProperties(css, { toPrefix: '--wxt-' })).toBe(
        expected,
      );
    });

    it('should remove fromPrefix when toPrefix is undefined', () => {
      const css = `.class { --tw-prop: value; }`;
      const expected = `.class { prop: value; }`;
      expect(renameCssCustomProperties(css, { fromPrefix: '--tw-' })).toBe(
        expected,
      );
    });

    it('should replace with empty string when toPrefix is empty string', () => {
      const css = `.class { --tw-prop: value; }`;
      const expected = `.class { prop: value; }`;
      expect(
        renameCssCustomProperties(css, { fromPrefix: '--tw-', toPrefix: '' }),
      ).toBe(expected);
    });
  });
});
