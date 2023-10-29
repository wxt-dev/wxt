import { describe, expect, it } from 'vitest';
import { importEntrypointFile } from '~/core/utils/building';
import { fakeInternalConfig } from '~/core/utils/testing/fake-objects';
import { resolve } from 'node:path';

const entrypointPath = (filename: string) =>
  resolve('src/core/utils/__tests__/test-entrypoints', filename);

const config = fakeInternalConfig({
  imports: false,
  debug: false,
  // Run inside the demo folder so that wxt is in the node_modules
  // WXT must also be built for these tests to pass
  root: 'demo',
});

describe('importEntrypointFile', () => {
  it.each([
    ['background.ts', { main: expect.any(Function) }],
    ['content.ts', { main: expect.any(Function), matches: ['<all_urls>'] }],
    ['unlisted.ts', { main: expect.any(Function) }],
    ['react.tsx', { main: expect.any(Function) }],
    ['with-named.ts', { main: expect.any(Function) }],
  ])(
    'should return the default export of test-entrypoints/%s',
    async (file, expected) => {
      const actual = await importEntrypointFile(entrypointPath(file), config);

      expect(actual).toEqual(expected);
    },
  );

  it('should return undefined when there is no default export', async () => {
    const actual = await importEntrypointFile(
      entrypointPath('no-default-export.ts'),
      config,
    );

    expect(actual).toBeUndefined();
  });
});
