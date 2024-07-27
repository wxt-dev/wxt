import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

describe('Remote Code', () => {
  it('should download "url:*" modules and include them in the final bundle', async () => {
    const url = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js';
    const project = new TestProject();
    project.addFile(
      'entrypoints/popup.ts',
      `import "url:${url}"
      export default defineUnlistedScript(() => {})`,
    );

    await project.build();

    const output = await project.serializeFile('.output/chrome-mv3/popup.js');
    expect(output).toContain(
      // Some text that will hopefully be in future versions of this script
      'lodash.com',
    );
    expect(output).not.toContain(url);
    expect(
      await project.fileExists(`.wxt/cache/${encodeURIComponent(url)}`),
    ).toBe(true);
  });
});
