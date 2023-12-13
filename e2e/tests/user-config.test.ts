import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';
import { InlineConfig } from '~/types';

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
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","background":{"service_worker":"background.js"}}"
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
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","background":{"service_worker":"background.js"}}"
    `);
  });

  it('should merge inline and user config based manifests', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/unlisted.html');
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

    expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
      .toMatchInlineSnapshot(`
      ".output/chrome-mv3/manifest.json
      ----------------------------------------
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","example_customization":["3","build","production","chrome"]}"
    `);
  });

  it('should exclude the polyfill when the experimental setting is set to false', async () => {
    const buildBackground = async (config?: InlineConfig) => {
      const background = `export default defineBackground(() => console.log(browser.runtime.id));`;
      const projectWithPolyfill = new TestProject();
      projectWithPolyfill.addFile('entrypoints/background.ts', background);
      await projectWithPolyfill.build(config);
      return await projectWithPolyfill.serializeFile(
        '.output/chrome-mv3/background.js',
      );
    };

    const withPolyfill = await buildBackground();
    const withoutPolyfill = await buildBackground({
      experimental: {
        includeBrowserPolyfill: false,
      },
    });
    expect(withoutPolyfill).not.toBe(withPolyfill);
  });
});
