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

    const messages = await parseMessagesFile(`file.${extension}`);
    await generateChromeMessagesFile('output.json', messages);
    await generateDtsFile('output.d.ts', messages, 'TestI18n');

    expect(mockWriteFile).toBeCalledTimes(2);
    expect(mockWriteFile.mock.calls[0][1]).toMatchSnapshot();
    expect(mockWriteFile.mock.calls[1][1]).toMatchSnapshot();
  });
});
