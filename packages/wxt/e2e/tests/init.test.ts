import glob from 'fast-glob';
import { mkdir, writeJson } from 'fs-extra';
import { describe, expect, it } from 'vitest';
import { initialize } from '../../src';
import { TestProject } from '../utils';

describe('Init command', () => {
  it('should download and create a template', async () => {
    const project = new TestProject();

    await initialize({
      directory: project.root,
      packageManager: 'npm',
      template: 'vue',
    });

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
      initialize({
        directory: project.root,
        template: 'vue',
        packageManager: 'npm',
      }),
    ).rejects.toThrowError('Command failed with exit code 1:');
  });
});
