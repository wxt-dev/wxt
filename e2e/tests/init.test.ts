import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';
import { execaCommand } from 'execa';

describe('Init command', () => {
  it('should download and create a template', async () => {
    const project = new TestProject();

    await execaCommand(`pnpm -s wxt init ${project.root} -t vue --pm npm`, {
      env: { ...process.env, CI: 'true' },
      stdio: 'ignore',
    });
    const { stdout } = await execaCommand('ls -AR', { cwd: project.root });

    expect(stdout).toMatchInlineSnapshot(`
      ".gitignore
      .vscode
      README.md
      assets
      components
      entrypoints
      package.json
      public
      tsconfig.json
      wxt.config.ts

      ./.vscode:
      extensions.json

      ./assets:
      vue.svg

      ./components:
      HelloWorld.vue

      ./entrypoints:
      background.ts
      popup

      ./entrypoints/popup:
      App.vue
      index.html
      main.ts
      style.css

      ./public:
      icon
      wxt.svg

      ./public/icon:
      128.png
      16.png
      32.png
      48.png
      96.png"
    `);
  }, 60e3);
});
