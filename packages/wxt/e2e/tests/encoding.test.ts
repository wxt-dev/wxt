import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vite-plus/test';

import { TestProject } from '../utils';

describe('Encoding', () => {
  // See more details about this test, see:
  // https://github.com/wxt-dev/wxt/issues/353#issuecomment-4093271292
  const KNOWN_BAD_CHAR = '￿';
  const ESCAPED_BAD_CHAR = '\\uFFFF';

  async function buildWithBadChar(escapeUnicode: boolean): Promise<string> {
    const project = new TestProject();

    // `project.addFile` writes the file as UTF8
    project.addFile(
      'entrypoints/example.ts',
      `export default defineUnlistedScript(() => console.log('${KNOWN_BAD_CHAR}'))`,
    );
    await project.build({
      experimental: {
        escapeUnicode,
      },
    });

    const file = project.resolvePath('.output/chrome-mv3/example.js');
    return await readFile(file, 'ascii');
  }

  // TODO: Re-enable once oxc supports charset:ascii. See `isRolldownVersion`
  // branch in `packages/wxt/src/internal/builders/vite/index.ts`.
  it.skip('should convert unicode characters to ascii escaped chars when experimental.escapeUnicode=true', async () => {
    const output = await buildWithBadChar(true);
    expect(output).toContain(ESCAPED_BAD_CHAR);
  });

  it('should convert unicode characters to ascii escaped chars when experimental.escapeUnicode=false', async () => {
    const output = await buildWithBadChar(false);
    expect(output).not.toContain(ESCAPED_BAD_CHAR);
  });
});
