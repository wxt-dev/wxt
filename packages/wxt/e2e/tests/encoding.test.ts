import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { TestProject } from '../utils';

describe('Encoding', () => {
  it('should convert unicode characters to ascii escaped chars', async () => {
    const UTF8_CHAR = '丂';
    const ASCII_ESCAPED = '\\u4E02';

    const project = new TestProject();

    // `project.addFile` writes the file as UTF8
    project.addFile(
      'entrypoints/example.ts',
      `export default defineUnlistedScript(() => console.log('${UTF8_CHAR}'))`,
    );
    await project.build();

    const file = project.resolvePath('.output/chrome-mv3/example.js');
    const asciiOutput = await readFile(file, 'ascii');
    expect(asciiOutput).toContain(ASCII_ESCAPED);
  });
});
