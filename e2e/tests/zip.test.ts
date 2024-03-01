import { describe, expect, it } from 'vitest';
import { TestProject } from '../utils';
import extract from 'extract-zip';
import { execaCommand } from 'execa';
import { readFile, writeFile } from 'fs-extra';

process.env.WXT_PNPM_IGNORE_WORKSPACE = 'true';

describe('Zipping', () => {
  it('should download packages and produce a valid build when zipping sources', async () => {
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
    expect(await project.fileExists('.output/')).toBe(true);

    await extract(sourcesZip, { dir: unzipDir });
    // Update package json wxt path
    const packageJsonPath = project.resolvePath(unzipDir, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    packageJson.dependencies.wxt = '../../../../..';
    await writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf-8',
    );

    // Build zipped extension
    await expect(
      execaCommand('pnpm i --ignore-workspace', { cwd: unzipDir }),
    ).resolves.toMatchObject({ exitCode: 0 });
    await expect(
      execaCommand('pnpm wxt build -b firefox', { cwd: unzipDir }),
    ).resolves.toMatchObject({ exitCode: 0 });

    await expect(project.fileExists(unzipDir, '.output')).resolves.toBe(true);
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
          "wxt": "../../../../..",
          "flatten": "1.0.3"
        },
        "resolutions": {
          "flatten@1.0.3": "file://./local_modules/flatten-1.0.3.tgz"
        }
      }"
    `);
  });
});
