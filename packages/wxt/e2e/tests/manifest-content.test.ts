import { describe, it, expect } from 'vitest';

import { TestProject } from '../utils';

describe('Manifest Content', () => {
  it.each([
    { browser: undefined, outDir: 'chrome-mv3', expected: undefined },
    { browser: 'chrome', outDir: 'chrome-mv3', expected: undefined },
    { browser: 'firefox', outDir: 'firefox-mv2', expected: true },
    { browser: 'safari', outDir: 'safari-mv2', expected: false },
  ])(
    'should respect the per-browser entrypoint option with %j',
    async ({ browser, expected, outDir }) => {
      const project = new TestProject();

      project.addFile(
        'entrypoints/background.ts',
        `export default defineBackground({
          persistent: {
            firefox: true,
            safari: false,
          },
          main: () => {},
        })`,
      );
      await project.build({ browser });

      const safariManifest = await project.getOutputManifest(
        `.output/${outDir}/manifest.json`,
      );
      expect(safariManifest.background.persistent).toBe(expected);
    },
  );

  it('should generate the same manifest for an ios build as for a safari build', async () => {
    const project = new TestProject();

    project.addFile(
      'entrypoints/background.ts',
      `export default defineBackground({ main: () => {} })`,
    );
    project.addFile('entrypoints/popup.html', '<html></html>');
    project.addFile(
      'entrypoints/one.content/index.ts',
      `import './style.css';

      export default defineContentScript({
        matches: ['*://google.com/*'],
        cssInjectionMode: 'ui',
        main: () => {},
      })`,
    );
    project.addFile('entrypoints/one.content/style.css', `body { color: red }`);

    await project.build({ browser: 'safari' });
    const safariManifest = await project.getOutputManifest(
      '.output/safari-mv2/manifest.json',
    );

    // The output directory and the default manifest version still use the raw
    // `--browser` label, only the generated manifest follows the actual browser.
    await project.build({ browser: 'ios' });
    const iosManifest = await project.getOutputManifest(
      '.output/ios-mv2/manifest.json',
    );

    expect(iosManifest).toEqual(safariManifest);
  });

  it('should apply a custom targetBrowserMap', async () => {
    const project = new TestProject();
    project.setConfigFileConfig({
      targetBrowserMap: {
        waterfox: 'firefox',
      },
    });

    project.addFile(
      'entrypoints/background.ts',
      `export default defineBackground({ main: () => {} })`,
    );

    await project.build({ browser: 'waterfox' });
    const manifest = await project.getOutputManifest(
      '.output/waterfox-mv2/manifest.json',
    );

    // Firefox is the only browser that defaults to MV2, so an MV2 build of a
    // custom label proves the mapping was applied.
    expect(manifest.manifest_version).toBe(2);
  });
});
