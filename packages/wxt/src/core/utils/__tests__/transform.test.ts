import { describe, it, expect } from 'vitest';
import { removeMainFunctionCode } from '../transform';

describe('Transform Utils', () => {
  describe('removeMainFunctionCode', () => {
    it.each(['defineBackground', 'defineUnlistedScript'])(
      'should remove the first arrow function argument for %s',
      (def) => {
        const INPUT = `
          export default ${def}(() => {
            console.log();
          })
        `;
        const EXPECTED = `export default ${def}();`;

        const actual = removeMainFunctionCode(INPUT).code;

        expect(actual).toEqual(EXPECTED);
      },
    );

    it.each(['defineBackground', 'defineUnlistedScript'])(
      'should remove the first function argument for %s',
      (def) => {
        const INPUT = `
          export default ${def}(function () {
            console.log();
          })
        `;
        const EXPECTED = `export default ${def}();`;

        const actual = removeMainFunctionCode(INPUT).code;

        expect(actual).toEqual(EXPECTED);
      },
    );

    it.each([
      'defineBackground',
      'defineContentScript',
      'defineUnlistedScript',
    ])('should remove the main field from %s', (def) => {
      const INPUT = `
        export default ${def}({
          asdf: "asdf",
          main: () => {},
        })
      `;
      const EXPECTED = `export default ${def}({
  asdf: "asdf"
})`;

      const actual = removeMainFunctionCode(INPUT).code;

      expect(actual).toEqual(EXPECTED);
    });

    it('should remove unused imports', () => {
      const INPUT = `
        import { defineBackground } from "#imports"
        import { test1 } from "somewhere1"
        import test2 from "somewhere2"

        export default defineBackground(() => {})
      `;
      const EXPECTED = `import { defineBackground } from "#imports"

export default defineBackground();`;

      const actual = removeMainFunctionCode(INPUT).code;

      expect(actual).toEqual(EXPECTED);
    });

    it('should remove explict side-effect imports', () => {
      const INPUT = `
        import { defineBackground } from "#imports"
        import "my-polyfill"
        import "./style.css"

        export default defineBackground(() => {})
      `;
      const EXPECTED = `import { defineBackground } from "#imports"

export default defineBackground();`;

      const actual = removeMainFunctionCode(INPUT).code;

      expect(actual).toEqual(EXPECTED);
    });

    it("should remove any functions delcared outside the main function that aren't used", () => {
      const INPUT = `
              function getMatches() {
                return ["*://*/*"]
              }
              function unused1() {}
              function unused2() {
                unused1();
              }

              export default defineContentScript({
                matches: getMatches(),
                main: () => {},
              })
            `;
      const EXPECTED = `function getMatches() {
  return ["*://*/*"]
}

export default defineContentScript({
  matches: getMatches()
})`;

      const actual = removeMainFunctionCode(INPUT).code;

      expect(actual).toEqual(EXPECTED);
    });

    it("should remove any variables delcared outside the main function that aren't used", () => {
      const INPUT = `
        const unused1 = "a", matches = ["*://*/*"];
        let unused2 = unused1 + "b";

        export default defineContentScript({
          matches,
          main: () => {}
        })
      `;
      const EXPECTED = `const matches = ["*://*/*"];

export default defineContentScript({
  matches
})`;

      const actual = removeMainFunctionCode(INPUT).code;

      expect(actual).toEqual(EXPECTED);
    });

    it('should not remove any variables delcared outside the main function that are used', () => {
      const INPUT = `
        const [ a ] = [ 123, 456 ];
        const { b } = { b: 123 };
        const { c: { d } } = { c: { d: 123 } };
        const { e, ...rest } = { e: 123, f: 456 };

        console.log(a);
        console.log(b);
        console.log(d);
        console.log(e);
        console.log(rest);

        export default defineBackground(() => {
          console.log('Hello background!', { id: browser.runtime.id });
        });`;

      const EXPECTED = `const [ a ] = [ 123, 456 ];
const { b } = { b: 123 };
const { c: { d } } = { c: { d: 123 } };
const { e, ...rest } = { e: 123, f: 456 };

console.log(a);
console.log(b);
console.log(d);
console.log(e);
console.log(rest);

export default defineBackground();`;

      const actual = removeMainFunctionCode(INPUT).code;
      expect(actual).toEqual(EXPECTED);
    });
  });
});
