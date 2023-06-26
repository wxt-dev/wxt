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
      `export default defineBackgroundScript(
        () => console.log('Hello background'),
      );`,
    );

    await project.build();

    const output = await project.serializeOutput();
    expect(output).toMatchInlineSnapshot(`
      ".output/chrome-mv3/background.js
      ----------------------------------------
      (function(){\\"use strict\\";function o(n){return typeof n==\\"function\\"?{main:n}:n}const r=o(()=>console.log(\\"Hello background\\"));try{r.main()instanceof Promise&&console.warn(\\"The background's main() function return a promise, but it must be synchonous\\")}catch(n){throw console.error(\\"The background script crashed on startup!\\"),n}})();

      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"background\\":{\\"service_worker\\":\\"background.js\\"}}"
    `);
  });

  it("should respect the 'entrypoints' directory", async () => {
    const project = new TestProject();
    project.setConfigFileConfig({
      entrypointsDir: 'entries',
    });
    project.addFile(
      'entries/background.ts',
      `export default defineBackgroundScript(() => console.log('Hello background'));`,
    );

    await project.build();

    const output = await project.serializeOutput();
    expect(output).toMatchInlineSnapshot(`
      ".output/chrome-mv3/background.js
      ----------------------------------------
      (function(){\\"use strict\\";function o(n){return typeof n==\\"function\\"?{main:n}:n}const r=o(()=>console.log(\\"Hello background\\"));try{r.main()instanceof Promise&&console.warn(\\"The background's main() function return a promise, but it must be synchonous\\")}catch(n){throw console.error(\\"The background script crashed on startup!\\"),n}})();

      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"background\\":{\\"service_worker\\":\\"background.js\\"}}"
    `);
  });
});
