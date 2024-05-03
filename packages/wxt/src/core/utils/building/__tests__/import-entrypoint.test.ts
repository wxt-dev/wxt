import { beforeEach, describe, expect, it } from 'vitest';
import { importEntrypointFile } from '~/core/utils/building';
import { resolve } from 'node:path';
import { unnormalizePath } from '../../paths';
import { setFakeWxt } from '../../testing/fake-objects';

const entrypointPath = (filename: string) =>
  resolve(__dirname, 'test-entrypoints', filename);

describe('importEntrypointFile', () => {
  beforeEach(() => {
    setFakeWxt({
      config: {
        imports: false,
        debug: false,
        // Run inside the demo folder so that wxt is in the node_modules
        // WXT must also be built for these tests to pass
        root: 'demo',
      },
    });
  });

  it.each([
    ['background.ts', { main: expect.any(Function) }],
    ['content.ts', { main: expect.any(Function), matches: ['<all_urls>'] }],
    ['unlisted.ts', { main: expect.any(Function) }],
    ['react.tsx', { main: expect.any(Function) }],
    ['with-named.ts', { main: expect.any(Function) }],
  ])(
    'should return the default export of test-entrypoints/%s',
    async (file, expected) => {
      const actual = await importEntrypointFile(entrypointPath(file));

      expect(actual).toEqual(expected);
    },
  );

  it('should return undefined when there is no default export', async () => {
    const actual = await importEntrypointFile(
      entrypointPath('no-default-export.ts'),
    );

    expect(actual).toBeUndefined();
  });

  it('should throw a custom error message when an imported variable is used before main', async () => {
    await expect(() =>
      importEntrypointFile(entrypointPath('imported-option.ts')),
    ).rejects.toThrowError(
      `imported-option.ts: Cannot use imported variable "faker" outside the main function.`,
    );
  });
});
