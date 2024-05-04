import { describe, it, expect } from 'vitest';
import { removeMainFunctionCode } from '../transform';

describe('Transform Utils', () => {
  describe('removeMainFunctionCode', () => {
    it.each(['defineBackground', 'defineUnlistedScript'])(
      'should remove the first arrow function argument for %s',
      (def) => {
        const input = `export default ${def}(() => {
            console.log();
          })`;
        const expected = `export default ${def}(() => {})`;

        const actual = removeMainFunctionCode(input).code;

        expect(actual).toEqual(expected);
      },
    );
    it.each(['defineBackground', 'defineUnlistedScript'])(
      'should remove the first function argument for %s',
      (def) => {
        const input = `export default ${def}(function () {
            console.log();
          })`;
        const expected = `export default ${def}(function () {})`;

        const actual = removeMainFunctionCode(input).code;

        expect(actual).toEqual(expected);
      },
    );

    it.each([
      'defineBackground',
      'defineContentScript',
      'defineUnlistedScript',
    ])('should remove the main field from %s', (def) => {
      const input = `export default ${def}({
        asdf: "asdf",
        main: () => {},
      })`;
      const expected = `export default ${def}({
  asdf: "asdf"
})`;

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toEqual(expected);
    });
  });
});
