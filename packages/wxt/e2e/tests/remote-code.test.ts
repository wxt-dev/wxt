import { describe, expect, it } from 'vitest';
import { TestProject } from '../utils';

describe('Remote Code', () => {
  it('should download "url:*" modules and include them in the final bundle', async () => {
    const URL = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js';
    const project = new TestProject();
    project.addFile(
      'entrypoints/popup.ts',
      `import "url:${URL}"
      export default defineUnlistedScript(() => {})`,
    );

    await project.build();

    const output = await project.serializeFile('.output/chrome-mv3/popup.js');
    expect(output).toContain(
      // Some text that will hopefully be in future versions of this script
      '__lodash_placeholder__',
    );
    expect(output).not.toContain(URL);
    expect(
      await project.fileExists(`.wxt/cache/${encodeURIComponent(URL)}`),
    ).toBe(true);
  });
});
