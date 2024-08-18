import { describe, it, expect, vi } from 'vitest';
import {
  parseMessagesFile,
  generateChromeMessagesFile,
  generateTypeFile,
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
    await generateTypeFile('output.d.ts', messages);
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
      "export type WxtI18nStructure = {
        "simple": { substitutions: 0, plural: false };
        "sub": { substitutions: 1, plural: false };
        "nested.example": { substitutions: 0, plural: false };
        "nested.array.0": { substitutions: 0, plural: false };
        "nested.array.1": { substitutions: 0, plural: false };
        "nested.chrome1": { substitutions: 0, plural: false };
        "nested.chrome2": { substitutions: 0, plural: false };
        "nested.chrome3": { substitutions: 1, plural: false };
        "nested.chrome4": { substitutions: 0, plural: false };
        "plural0": { substitutions: 1, plural: true };
        "plural1": { substitutions: 1, plural: true };
        "pluralN": { substitutions: 1, plural: true };
        "pluralSub": { substitutions: 2, plural: true };
        "@@extension_id": { substitutions: 0, plural: false };
        "@@ui_locale": { substitutions: 0, plural: false };
        "@@bidi_dir": { substitutions: 0, plural: false };
        "@@bidi_reversed_dir": { substitutions: 0, plural: false };
        "@@bidi_start_edge": { substitutions: 0, plural: false };
        "@@bidi_end_edge": { substitutions: 0, plural: false };
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
    const expectedDts = `export type WxtI18nStructure = {
  "simple": { substitutions: 0, plural: false };
  "@@extension_id": { substitutions: 0, plural: false };
  "@@ui_locale": { substitutions: 0, plural: false };
  "@@bidi_dir": { substitutions: 0, plural: false };
  "@@bidi_reversed_dir": { substitutions: 0, plural: false };
  "@@bidi_start_edge": { substitutions: 0, plural: false };
  "@@bidi_end_edge": { substitutions: 0, plural: false };
}
`;
    const expectedChromeMessages =
      JSON.stringify({ simple: { message: 'example' } }, null, 2) + '\n';

    mockReadFile.mockResolvedValue(fileText);

    const messages = await parseMessagesFile(`file.${extension}`);
    await generateChromeMessagesFile('output.json', messages);
    await generateTypeFile('output.d.ts', messages);

    expect(mockWriteFile).toBeCalledTimes(2);
    expect(mockWriteFile).toBeCalledWith(
      'output.json',
      expectedChromeMessages,
      'utf8',
    );
    expect(mockWriteFile).toBeCalledWith('output.d.ts', expectedDts, 'utf8');
  });
});
