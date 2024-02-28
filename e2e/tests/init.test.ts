import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';
import { execaCommand } from 'execa';
import glob from 'fast-glob';

describe('Init command', () => {
  it('should download and create a template', async () => {
    const project = new TestProject();

    await execaCommand(`pnpm -s wxt init ${project.root} -t vue --pm npm`, {
      env: { ...process.env, CI: 'true' },
      stdio: 'ignore',
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
});
