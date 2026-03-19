import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { TestProject } from '../utils';

describe('Encoding', () => {
  it('should convert unicode characters to ascii escaped chars', async () => {
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
