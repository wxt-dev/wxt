import extract from 'extract-zip';
import { x as spawn } from 'tinyexec';
import { describe, expect, it } from 'vitest';
import { TestProject } from '../utils';

describe('Zipping', () => {
  it('should download packages and include them as overrides in the zipped package.json', async () => {
    const project = new TestProject({
      name: 'test',
      version: '1.0.0',
      dependencies: {
        flatten: '1.0.3',
      },
    });
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );
    const unzipDir = project.resolvePath('.output/test-1.0.0-sources');
    const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

    await project.zip({
      browser: 'firefox',
      zip: { downloadPackages: ['flatten'] },
    });
    expect(await project.pathExists('.output/')).toBe(true);

    await extract(sourcesZip, { dir: unzipDir });

    // Build zipped extension
    await expect(
      spawn('bun', ['install'], {
        throwOnError: true,
        nodeOptions: { cwd: unzipDir },
      }),
    ).resolves.toMatchObject({ exitCode: 0 });
    await expect(
      spawn('bun', ['wxt', 'build', '-b', 'firefox'], {
        throwOnError: true,
        nodeOptions: { cwd: unzipDir },
      }),
    ).resolves.toMatchObject({ exitCode: 0 });

    await expect(project.pathExists(unzipDir, '.output')).resolves.toBe(true);
    expect(
      await project.serializeFile(
        project.resolvePath(unzipDir, 'package.json'),
      ),
    ).toMatchInlineSnapshot(`
      ".output/test-1.0.0-sources/package.json
      ----------------------------------------
      {
        "name": "test",
        "description": "Example description",
        "version": "1.0.0",
        "dependencies": {
          "flatten": "1.0.3"
        },
        "overrides": {
          "flatten@1.0.3": "file://./.wxt/local_modules/flatten-1.0.3.tgz"
        }
      }"
    `);
  });

  it('should correctly apply template variables for zip file names based on provided config', async () => {
    const project = new TestProject({
      name: 'test',
      version: '1.0.0-beta.1',
    });
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );
    const artifactZip = '.output/test-1.0.0-beta.1-firefox-dev.zip';
    const sourcesZip = '.output/test-1.0.0-beta.1-sources-dev.zip';

    await project.zip({
      browser: 'firefox',
      mode: 'development',
      zip: {
        artifactTemplate:
          '{{name}}-{{packageVersion}}-{{browser}}{{modeSuffix}}.zip',
        sourcesTemplate:
          '{{name}}-{{packageVersion}}-sources{{modeSuffix}}.zip',
      },
    });

    expect(await project.pathExists(artifactZip)).toBe(true);
    expect(await project.pathExists(sourcesZip)).toBe(true);
  });

  it('should not zip hidden files into sources by default', async () => {
    const project = new TestProject({
      name: 'test',
      version: '1.0.0',
    });
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );
    project.addFile('.env');
    project.addFile('.hidden-dir/file');
    const unzipDir = project.resolvePath('.output/test-1.0.0-sources');
    const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

    await project.zip({
      browser: 'firefox',
    });
    await extract(sourcesZip, { dir: unzipDir });
    expect(await project.pathExists(unzipDir, '.env')).toBe(false);
    expect(await project.pathExists(unzipDir, '.hidden-dir/file')).toBe(false);
  });

  it('should zip hidden files and directories when dotSources is enabled', async () => {
    const project = new TestProject({
      name: 'test',
      version: '1.0.0',
    });
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );
    project.addFile('.hidden-dir/file');
    project.addFile('.hidden-dir/nested/file');
    const unzipDir = project.resolvePath('.output/test-1.0.0-sources');
    const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

    await project.zip({
      browser: 'firefox',
      zip: {
        dotSources: true,
      },
    });
    await extract(sourcesZip, { dir: unzipDir });
    expect(await project.pathExists(unzipDir, '.hidden-dir/file')).toBe(true);
    expect(await project.pathExists(unzipDir, '.hidden-dir/nested/file')).toBe(
      true,
    );
  });

  it('should allow ignoring some hidden files', async () => {
    const project = new TestProject({
      name: 'test',
      version: '1.0.0',
    });
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );
    project.addFile('.env');
    project.addFile('.hidden-dir/file');
    project.addFile('.hidden-dir/nested/file1');
    project.addFile('.hidden-dir/nested/file2');
    const unzipDir = project.resolvePath('.output/test-1.0.0-sources');
    const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

    await project.zip({
      browser: 'firefox',
      zip: {
        dotSources: true,
        excludeSources: ['.hidden-dir/nested'],
      },
    });
    await extract(sourcesZip, { dir: unzipDir });
    expect(await project.pathExists(unzipDir, '.env')).toBe(true);
    expect(await project.pathExists(unzipDir, '.hidden-dir/file')).toBe(true);
    expect(await project.pathExists(unzipDir, '.hidden-dir/nested/file1')).toBe(
      false,
    );
    expect(await project.pathExists(unzipDir, '.hidden-dir/nested/file2')).toBe(
      false,
    );
  });

  it('should not include all files when includeSources is provided', async () => {
    const project = new TestProject({
      name: 'test',
      version: '1.0.0',
    });
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );
    project.addFile('utils/example.ts', 'export const x = 1;');
    project.addFile('secrets/api-key.txt', 'supersecret');
    project.addFile('cache/data.json', '{}');
    const unzipDir = project.resolvePath('.output/test-1.0.0-sources');
    const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

    await project.zip({
      browser: 'firefox',
      zip: {
        includeSources: ['entrypoints/**', 'utils/**'],
      },
    });
    await extract(sourcesZip, { dir: unzipDir });

    // Included files should be present
    expect(
      await project.pathExists(unzipDir, 'entrypoints/background.ts'),
    ).toBe(true);
    expect(await project.pathExists(unzipDir, 'utils/example.ts')).toBe(true);

    // Non-included files should NOT be present (allowlist behavior)
    expect(await project.pathExists(unzipDir, 'secrets/api-key.txt')).toBe(
      false,
    );
    expect(await project.pathExists(unzipDir, 'cache/data.json')).toBe(false);
  });

  it('should exclude skipped entrypoints from respective browser sources zip', async () => {
    const project = new TestProject({
      name: 'test',
      version: '1.0.0',
    });
    project.addFile(
      'entrypoints/not-firefox.content.ts',
      `export default defineContentScript({
        matches: ['*://*/*'],
        exclude: ['firefox'],
        main() {},
      });`,
    );
    project.addFile(
      'entrypoints/all.content.ts',
      `export default defineContentScript({
        matches: ['*://*/*'],
        main(ctx) {},
      });`,
    );
    const unzipDir = project.resolvePath('.output/test-1.0.0-sources');
    const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

    await project.zip({
      browser: 'firefox',
    });
    await extract(sourcesZip, { dir: unzipDir });
    expect(
      await project.pathExists(unzipDir, 'entrypoints/not-firefox.content.ts'),
    ).toBe(false);
    expect(
      await project.pathExists(unzipDir, 'entrypoints/all.content.ts'),
    ).toBe(true);
  });

  it.each(['firefox', 'opera'])(
    'should create sources zip for "%s" browser when sourcesZip is undefined',
    async (browser) => {
      const project = new TestProject({
        name: 'test',
        version: '1.0.0',
      });
      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {});',
      );
      const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

      await project.zip({
        browser,
      });

      expect(await project.pathExists(sourcesZip)).toBe(true);
    },
  );

  it.each(['firefox', 'chrome'])(
    'should create sources zip for "%s" when sourcesZip is true',
    async (browser) => {
      const project = new TestProject({
        name: 'test',
        version: '1.0.0',
      });
      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {});',
      );
      const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

      await project.zip({
        browser,
        zip: {
          zipSources: true,
        },
      });

      expect(await project.pathExists(sourcesZip)).toBe(true);
    },
  );

  it.each(['firefox', 'chrome'])(
    'should not create sources zip for "%s" when sourcesZip is false',
    async (browser) => {
      const project = new TestProject({
        name: 'test',
        version: '1.0.0',
      });
      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {});',
      );
      const sourcesZip = project.resolvePath('.output/test-1.0.0-sources.zip');

      await project.zip({
        browser,
        zip: {
          zipSources: false,
        },
      });

      expect(await project.pathExists(sourcesZip)).toBe(false);
    },
  );

  it('should include files in the zip when negated in zip.exclude', async () => {
    const project = new TestProject({
      name: 'test',
      version: '1.0.0',
    });
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );
    const unzipDir = project.resolvePath('.output/test-1.0.0-chrome');
    const sourcesZip = project.resolvePath('.output/test-1.0.0-chrome.zip');

    await project.zip({
      zip: {
        // Exclude all JSON files except for ones named `manifest.json`
        exclude: ['**/!(manifest).json'],
      },
    });

    await extract(sourcesZip, { dir: unzipDir });
    expect(await project.pathExists(unzipDir, 'manifest.json')).toBe(true);
  });
});
