import { describe, it, expect } from 'vitest';
import { removeMainFunctionCode } from '../transform';

describe('Transform Utils', () => {
  describe('removeMainFunctionCode', () => {
    it.each(['defineBackground', 'defineUnlistedScript'])(
      'should remove the first arrow function argument for %s',
      (def) => {
        const input = `
          export default ${def}(() => {
            console.log();
          })
        `;
        const expected = `export default ${def}();`;

        const actual = removeMainFunctionCode(input).code;

        expect(actual).toEqual(expected);
      },
    );

    it.each(['defineBackground', 'defineUnlistedScript'])(
      'should remove the first function argument for %s',
      (def) => {
        const input = `
          export default ${def}(function () {
            console.log();
          })
        `;
        const expected = `export default ${def}();`;

        const actual = removeMainFunctionCode(input).code;

        expect(actual).toEqual(expected);
      },
    );

    it.each([
      'defineBackground',
      'defineContentScript',
      'defineUnlistedScript',
    ])('should remove the main field from %s', (def) => {
      const input = `
        export default ${def}({
          asdf: "asdf",
          main: () => {},
        })
      `;
      const expected = `export default ${def}({ asdf: "asdf" });`;

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toEqual(expected);
    });

    it('should remove the main method from an object', () => {
      const input = `
        export default defineContentScript({
          matches: ["*://*/*"],
          main(ctx) {
            console.log(ctx);
          },
        })
      `;
      const expected = `export default defineContentScript({ matches: ["*://*/*"] });`;

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toEqual(expected);
    });

    it('should preserve spread config when removing the main field', () => {
      const input = `
        const sharedConfig = {
          matches: ['*://*/*'],
        };

        export default defineContentScript({
          ...sharedConfig,
          runAt: 'document_idle',
          main(ctx) {
            console.log(ctx);
          },
        })
      `;

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toMatchInlineSnapshot(`
        "const sharedConfig = { matches: ["*://*/*"] };
        export default defineContentScript({
        	...sharedConfig,
        	runAt: "document_idle"
        });"
      `);
    });

    it('should remove unused imports', () => {
      const input = `
        import { defineBackground } from "#imports"
        import { test1 } from "somewhere1"
        import test2 from "somewhere2"

        export default defineBackground(() => {})
      `;
      const expected = `import { defineBackground } from "#imports";
export default defineBackground();`;

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toEqual(expected);
    });

    it('should only remove the unused specifiers of an import', () => {
      const input = `
        import defineBackground, { unused1, unused2 } from "#imports"

        export default defineBackground(() => {})
      `;
      const expected = `import defineBackground from "#imports";
export default defineBackground();`;

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toEqual(expected);
    });

    it('should remove explicit side-effect imports', () => {
      const input = `
        import { defineBackground } from "#imports"
        import "my-polyfill"
        import "./style.css"

        export default defineBackground(() => {})
      `;
      const expected = `import { defineBackground } from "#imports";
export default defineBackground();`;

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toEqual(expected);
    });

    it("should remove any functions declared outside the main function that aren't used", () => {
      const input = `
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

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toMatchInlineSnapshot(`
        "function getMatches() {
        	return ["*://*/*"];
        }
        export default defineContentScript({ matches: getMatches() });"
      `);
    });

    it("should remove any variables declared outside the main function that aren't used", () => {
      const input = `
        const unused1 = "a", matches = ["*://*/*"];
        let unused2 = unused1 + "b";

        export default defineContentScript({
          matches,
          main: () => {}
        })
      `;
      const expected = `const matches = ["*://*/*"];
export default defineContentScript({ matches });`;

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toEqual(expected);
    });

    it('should not remove any variables declared outside the main function that are used', () => {
      const input = `
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

      const actual = removeMainFunctionCode(input).code;

      expect(actual).toMatchInlineSnapshot(`
        "const [a] = [123, 456];
        const { b } = { b: 123 };
        const { c: { d } } = { c: { d: 123 } };
        const { e, ...rest } = {
        	e: 123,
        	f: 456
        };
        console.log(a);
        console.log(b);
        console.log(d);
        console.log(e);
        console.log(rest);
        export default defineBackground();"
      `);
    });

    it('should strip TypeScript syntax', () => {
      const input = `
        import type { ContentScriptContext } from "#imports";

        interface Options {
          name: string;
        }

        const matches: string[] = ["*://*/*"];

        export default defineContentScript({
          matches,
          main(ctx: ContentScriptContext) {
            console.log(ctx);
          },
        })
      `;
      const expected = `const matches = ["*://*/*"];
export default defineContentScript({ matches });`;

      const actual = removeMainFunctionCode(input, 'entrypoint.ts').code;

      expect(actual).toEqual(expected);
    });

    it('should throw an error when the code cannot be parsed', () => {
      expect(() => removeMainFunctionCode('const = ;')).toThrowError();
    });
  });
});
