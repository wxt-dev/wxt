import glob from 'fast-glob';
import { mkdir, writeJson } from 'fs-extra';
import spawn from 'nano-spawn';
import { describe, expect, it } from 'vitest';
import { TestProject, WXT_PACKAGE_DIR } from '../utils';

describe('Init command', () => {
  it('should download and create a template', async () => {
    const project = new TestProject();

    await spawn(
      'bun',
      [
        'run',
        '--silent',
        'wxt',
        'init',
        project.root,
        '-t',
        'vue',
        '--pm',
        'npm',
      ],
      {
        env: { CI: 'true' },
        stdio: 'inherit',
        cwd: WXT_PACKAGE_DIR,
      },
    );
    const files = await glob('**/*', {
      cwd: project.root,
      onlyFiles: true,
      dot: true,
    });

    expect(files.length).not.toBe(0);
  });

  it('should throw an error if the directory is not empty', async () => {
    const project = new TestProject();
    await mkdir(project.root, { recursive: true });
    await writeJson(project.resolvePath('package.json'), {});

    await expect(() =>
      spawn(
        'bun',
        [
          'run',
          '--silent',
          'wxt',
          'init',
          project.root,
          '-t',
          'vue',
          '--pm',
          'npm',
        ],
        {
          env: { CI: 'true' },
          stdio: 'ignore',
          cwd: WXT_PACKAGE_DIR,
        },
      ),
    ).rejects.toThrowError('Command failed with exit code 1:');
  });
});
