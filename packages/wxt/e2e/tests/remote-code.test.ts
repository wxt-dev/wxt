import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

const url = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js';
const integrity = 'sha256-qXBd/EfAdjOA2FGrGAG+b3YBn2tn5A6bhz+LSgYD96k=';

describe('Remote Code', () => {
  it('should download "url:*" modules and include them in the final bundle', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/popup.ts',
      `import "url#${integrity}:${url}"
      export default defineUnlistedScript(() => {})`,
    );

    await project.build();

    const output = await project.serializeFile('.output/chrome-mv3/popup.js');
    expect(output).toContain(
      // Some text that will hopefully be in future versions of this script
      '__lodash_placeholder__',
    );
    expect(output).not.toContain(url);
    expect(
      await project.pathExists(`.wxt/cache/${encodeURIComponent(url)}`),
    ).toBe(true);
  });

  it('should accept a hex integrity hash', async () => {
    const hex =
      'sha256-a9705dfc47c0763380d851ab1801be6f76019f6b67e40e9b873f8b4a0603f7a9';
    const project = new TestProject();
    project.addFile(
      'entrypoints/popup.ts',
      `import "url#${hex}:${url}"
      export default defineUnlistedScript(() => {})`,
    );

    await project.build();

    const output = await project.serializeFile('.output/chrome-mv3/popup.js');
    expect(output).toContain('__lodash_placeholder__');
  });

  it('should fail the build when the integrity hash is missing', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/popup.ts',
      `import "url:${url}"
      export default defineUnlistedScript(() => {})`,
    );

    await expect(project.build()).rejects.toMatchObject({
      cause: {
        message: expect.stringContaining(
          'URL imports must pin an integrity hash',
        ),
      },
    });
  });

  it('should fail the build when the integrity hash does not match', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/popup.ts',
      `import "url#sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=:${url}"
      export default defineUnlistedScript(() => {})`,
    );

    await expect(project.build()).rejects.toMatchObject({
      cause: {
        message: expect.stringContaining('Integrity check failed'),
      },
    });

    expect(
      await project.pathExists(`.wxt/cache/${encodeURIComponent(url)}`),
    ).toBe(false);
  });
});
