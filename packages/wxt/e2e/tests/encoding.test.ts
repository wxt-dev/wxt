import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import { TestProject } from '../utils';

describe('Encoding', () => {
  // TODO: Re-enable once oxc supports charset:ascii. See `isRolldownVersion`
  // branch in `packages/wxt/src/core/builders/vite/index.ts`.
  it.skip('should convert unicode characters to ascii escaped chars', async () => {
    // See more details about this test, see:
    // https://github.com/wxt-dev/wxt/issues/353#issuecomment-4093271292
    const KNOWN_BAD_CHAR = '￿';
    const ESCAPED_BAD_CHAR = '\\uFFFF';

    const project = new TestProject();

    // `project.addFile` writes the file as UTF8
    project.addFile(
      'entrypoints/example.ts',
      `export default defineUnlistedScript(() => console.log('${KNOWN_BAD_CHAR}'))`,
    );
    await project.build();

    const file = project.resolvePath('.output/chrome-mv3/example.js');
    const asciiOutput = await readFile(file, 'ascii');
    expect(asciiOutput).toContain(ESCAPED_BAD_CHAR);
  });
});
