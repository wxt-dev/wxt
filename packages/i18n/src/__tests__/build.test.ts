import { describe, it, expect, vi } from 'vitest';
import {
  parseMessagesFile,
  generateChromeMessagesFile,
  generateDtsFile,
} from '../build';
import {
  stringifyTOML,
  stringifyYAML,
  stringifyJSON5,
  stringifyJSON,
  stringifyJSONC,
} from 'confbox';
import { writeFile, readFile } from 'node:fs/promises';

vi.mock('node:fs/promises');
const mockWriteFile = vi.mocked(writeFile);
const mockReadFile = vi.mocked(readFile);

describe('Built Tools', () => {
  it('should correctly convert all types of message formats', async () => {
    const fileText = stringifyYAML({
      simple: 'example',
      sub: 'Hello $1',
      nested: {
        example: 'This is nested',
        array: ['One', 'Two'],
        chrome1: {
          message: 'test 1',
        },
        chrome2: {
          message: 'test 2',
          description: 'test',
        },
        chrome3: {
          message: 'Hello $NAME$, please visit $URL$',
          description: 'Label and link to a URL',
          placeholders: {
            url: {
              content: 'https://wxt.dev',
            },
            name: {
              content: '$1',
              example: 'Aaron',
            },
          },
        },
        chrome4: {
          message: 'Visit: $URL$',
          placeholders: {
            url: {
              content: 'https://wxt.dev',
            },
          },
        },
      },
      plural0: {
        0: 'Zero items',
        1: 'One item',
        n: '$1 items',
      },
      plural1: {
        1: 'One item',
        n: '$1 items',
      },
      pluralN: {
        n: '$1 items',
      },
      pluralSub: {
        1: 'Hello $2, I have one problem',
        n: 'Hello $2, I have $1 problems',
      },
    });

    mockReadFile.mockResolvedValue(fileText);

    const messages = await parseMessagesFile(`file.yml`);
    await generateChromeMessagesFile('output.json', messages);
    await generateDtsFile('output.d.ts', messages);
    const actualChromeMessagesFile = mockWriteFile.mock.calls[0][1];
    const actualDtsFile = mockWriteFile.mock.calls[1][1];

    expect(mockWriteFile).toBeCalledTimes(2);
    expect(actualChromeMessagesFile).toMatchInlineSnapshot(`
      "{
        "simple": {
          "message": "example"
        },
        "sub": {
          "message": "Hello $1"
        },
        "nested_example": {
          "message": "This is nested"
        },
        "nested_array_0": {
          "message": "One"
        },
        "nested_array_1": {
          "message": "Two"
        },
        "nested_chrome1": {
          "message": "test 1"
        },
        "nested_chrome2": {
          "message": "test 2",
          "description": "test"
        },
        "nested_chrome3": {
          "message": "Hello $NAME$, please visit $URL$",
          "description": "Label and link to a URL",
          "placeholders": {
            "url": {
              "content": "https://wxt.dev"
            },
            "name": {
              "content": "$1",
              "example": "Aaron"
            }
          }
        },
        "nested_chrome4": {
          "message": "Visit: $URL$",
          "placeholders": {
            "url": {
              "content": "https://wxt.dev"
            }
          }
        },
        "plural0": {
          "message": "Zero items | One item | $1 items"
        },
        "plural1": {
          "message": "One item | $1 items"
        },
        "pluralN": {
          "message": "$1 items"
        },
        "pluralSub": {
          "message": "Hello $2, I have one problem | Hello $2, I have $1 problems"
        }
      }
      "
    `);
    expect(actualDtsFile).toMatchInlineSnapshot(`
      "import "@wxt-dev/i18n"

      export interface GeneratedI18n {
        /**
         * "example"
         */
        t(key: "simple", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * "Hello $1"
         */
        t(key: "sub", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * "This is nested"
         */
        t(key: "nested_example", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * "One"
         */
        t(key: "nested_array_0", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * "Two"
         */
        t(key: "nested_array_1", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * "test 1"
         */
        t(key: "nested_chrome1", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * test
         *
         * "test 2"
         */
        t(key: "nested_chrome2", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * Label and link to a URL
         *
         * "Hello $NAME$, please visit $URL$"
         */
        t(key: "nested_chrome3", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * "Visit: $URL$"
         */
        t(key: "nested_chrome4", sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * 0 - "Zero items"
         * 1 - "One item"
         * n - "$1 items"
         */
        t(key: "plural0", n: number, sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * 1 - "One item"
         * n - "$1 items"
         */
        t(key: "plural1", n: number, sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * n - "$1 items"
         */
        t(key: "pluralN", n: number, sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * 1 - "Hello $2, I have one problem"
         * n - "Hello $2, I have $1 problems"
         */
        t(key: "pluralSub", n: number, sub: import("@wxt-dev/i18n").Substitution[]): string
        /**
         * The extension or app ID; you might use this string to construct URLs for resources inside the extension. Even unlocalized extensions can use this message.
         * Note: You can't use this message in a manifest file.
         *
         * "<browser.runtime.id>"
         */
        t(key: "@@extension_id"): string
        /**
         * "<browser.i18n.getUiLocale()>"
         */
        t(key: "@@ui_locale"): string
        /**
         * The text direction for the current locale, either "ltr" for left-to-right languages such as English or "rtl" for right-to-left languages such as Japanese.
         *
         * "<ltr|rtl>"
         */
        t(key: "@@bidi_dir"): string
        /**
         * If the @@bidi_dir is "ltr", then this is "rtl"; otherwise, it's "ltr".
         *
         * "<rtl|ltr>"
         */
        t(key: "@@bidi_reversed_dir"): string
        /**
         * If the @@bidi_dir is "ltr", then this is "left"; otherwise, it's "right".
         *
         * "<left|right>"
         */
        t(key: "@@bidi_start_edge"): string
        /**
         * If the @@bidi_dir is "ltr", then this is "right"; otherwise, it's "left".
         *
         * "<right|left>"
         */
        t(key: "@@bidi_end_edge"): string
        t(key: "@@extension_id" | "@@ui_locale" | "@@bidi_dir" | "@@bidi_reversed_dir" | "@@bidi_start_edge" | "@@bidi_end_edge"): string
        t(key: "simple" | "sub" | "nested_example" | "nested_array_0" | "nested_array_1" | "nested_chrome1" | "nested_chrome2" | "nested_chrome3" | "nested_chrome4", sub: import("@wxt-dev/i18n").Substitution[]): string
        t(key: "plural0" | "plural1" | "pluralN" | "pluralSub", n: number, sub: import("@wxt-dev/i18n").Substitution[]): string
      }
      "
    `);
  });

  it.each([
    ['yaml', stringifyYAML],
    ['yml', stringifyYAML],
    ['toml', stringifyTOML],
    ['json', stringifyJSON],
    ['jsonc', stringifyJSONC],
    ['json5', stringifyJSON5],
  ])('Parse and generate: %s', async (extension, stringify) => {
    const fileText = stringify({
      simple: 'example',
    });
    const expectedDts = `interface TestI18n {
  /**
   * "example"
   */
  t(key: "simple", sub?: import("@wxt-dev/i18n").Substitution[]): string
}
`;
    const expectedChromeMessages =
      JSON.stringify({ simple: { message: 'example' } }, null, 2) + '\n';

    mockReadFile.mockResolvedValue(fileText);

    const messages = await parseMessagesFile(`file.${extension}`);
    await generateChromeMessagesFile('output.json', messages);
    await generateDtsFile('output.d.ts', messages, 'TestI18n');

    expect(mockWriteFile).toBeCalledTimes(2);
    expect(mockWriteFile).toBeCalledWith(
      'output.json',
      expectedChromeMessages,
      'utf8',
    );
    expect(mockWriteFile).toBeCalledWith('output.d.ts', expectedDts, 'utf8');
  });
});
