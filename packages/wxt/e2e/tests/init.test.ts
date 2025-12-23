import { describe, it, expect } from 'vitest';
import { TestProject, WXT_PACKAGE_DIR } from '../utils';
import spawn from 'nano-spawn';
import glob from 'fast-glob';
import { mkdir, writeJson } from 'fs-extra';

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
        stdio: 'ignore',
        cwd: WXT_PACKAGE_DIR,
      },
    );
    const files = await glob('**/*', {
      cwd: project.root,
      onlyFiles: true,
      dot: true,
    });

    expect(files.sort()).toMatchInlineSnapshot(`
      [
        ".gitignore",
        ".vscode/extensions.json",
        "README.md",
        "assets/vue.svg",
        "components/HelloWorld.vue",
        "entrypoints/background.ts",
        "entrypoints/content.ts",
        "entrypoints/popup/App.vue",
        "entrypoints/popup/index.html",
        "entrypoints/popup/main.ts",
        "entrypoints/popup/style.css",
        "package.json",
        "public/icon/128.png",
        "public/icon/16.png",
        "public/icon/32.png",
        "public/icon/48.png",
        "public/icon/96.png",
        "public/wxt.svg",
        "tsconfig.json",
        "wxt.config.ts",
      ]
    `);
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
