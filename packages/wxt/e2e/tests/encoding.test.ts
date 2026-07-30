import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { TestProject } from '../utils';

describe('Encoding', () => {
  // See more details about this test, see:
  // https://github.com/wxt-dev/wxt/issues/353#issuecomment-4093271292
  const KNOWN_BAD_CHAR = '￿';
  const ESCAPED_BAD_CHAR = '\\uffff';

  async function buildWithBadChar(escapeUtf8: boolean): Promise<string> {
    const project = new TestProject();

    // `project.addFile` writes the file as UTF8
    project.addFile(
      'entrypoints/example.ts',
      `export default defineUnlistedScript(() => console.log('${KNOWN_BAD_CHAR}'))`,
    );
    await project.build({
      experimental: {
        escapeUtf8,
      },
    });

    const file = project.resolvePath('.output/chrome-mv3/example.js');
    return await readFile(file, 'ascii');
  }

  it('should convert unicode characters to ascii escaped chars when experimental.escapeUtf8=true', async () => {
    const output = await buildWithBadChar(true);
    expect(output).toContain(ESCAPED_BAD_CHAR);
  });

  it('should convert unicode characters to ascii escaped chars when experimental.escapeUtf8=true', async () => {
    const output = await buildWithBadChar(false);
    expect(output).not.toContain(ESCAPED_BAD_CHAR);
  });
});
