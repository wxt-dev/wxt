import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

describe('User Config', () => {
  // Root directory is tested with all tests.

  it("should respect the 'src' directory", async () => {
    const project = new TestProject();
    project.setConfigFileConfig({
      srcDir: 'src',
    });
    project.addFile(
      'src/entrypoints/background.ts',
      `export default defineBackground(
        () => console.log('Hello background'),
      );`,
    );

    await project.build();

    const output = await project.serializeOutput([
      '.output/chrome-mv3/background.js',
    ]);
    expect(output).toMatchInlineSnapshot(`
      ".output/chrome-mv3/background.js
      ----------------------------------------
      <contents-ignored>
      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"background\\":{\\"service_worker\\":\\"background.js\\"}}"
    `);
  });

  it("should respect the 'entrypoints' directory", async () => {
    const project = new TestProject();
    project.setConfigFileConfig({
      entrypointsDir: 'entries',
    });
    project.addFile(
      'entries/background.ts',
      `export default defineBackground(() => console.log('Hello background'));`,
    );

    await project.build();

    const output = await project.serializeOutput([
      '.output/chrome-mv3/background.js',
    ]);
    expect(output).toMatchInlineSnapshot(`
      ".output/chrome-mv3/background.js
      ----------------------------------------
      <contents-ignored>
      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"background\\":{\\"service_worker\\":\\"background.js\\"}}"
    `);
  });

  it('should merge inline and user config based manifests', async () => {
    const project = new TestProject();
    project.addFile(
      'wxt.config.ts',
      `import { defineConfig } from 'wxt';
      export default defineConfig({
        manifest: ({ mode, browser }) => ({
          // @ts-expect-error
          example_customization: [mode, browser],
        })
      })`,
    );

    await project.build({
      // @ts-expect-error: Specifically setting an invalid field for the test - it should show up in the snapshot
      manifest: ({ manifestVersion, command }) => ({
        example_customization: [String(manifestVersion), command],
      }),
    });

    const output = await project.serializeOutput();
    expect(output).toMatchInlineSnapshot(`
      ".output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"example_customization\\":[\\"production\\",\\"chrome\\",\\"3\\",\\"build\\"]}"
    `);
  });
});
