import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

// TODO: move to unit tests to speed this up - this doesn't have to be in E2E tests

describe('Manifest Content', () => {
  describe('popup', () => {
    const popupContent = (type?: 'browser_action' | 'page_action') => `
      <html>
        <head>
          ${type == null ? '' : `<meta name="manifest.type" content="${type}">`}
          <meta name="manifest.default_icon" content="{ '16': '/icon/16.png' }">
          <title>Default Title</title>
        </head>
      </html>
    `;

    it('should include an action for mv3', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', popupContent());

      await project.build();

      const manifest = await project.getOutputManifest();
      expect(manifest.action).toEqual({
        default_icon: { '16': '/icon/16.png' },
        default_title: 'Default Title',
        default_popup: 'popup.html',
      });
    });

    it.each([
      [undefined, 'browser_action'],
      ['browser_action', 'browser_action'],
      ['page_action', 'page_action'],
    ] as const)(
      'should include a browser_action for mv2',
      async (type, expectedType) => {
        const project = new TestProject();
        project.addFile('entrypoints/popup.html', popupContent(type));

        await project.build({ manifestVersion: 2 });

        const manifest = await project.getOutputManifest(
          '.output/chrome-mv2/manifest.json',
        );
        expect(manifest[expectedType]).toEqual({
          default_icon: { '16': '/icon/16.png' },
          default_title: 'Default Title',
          default_popup: 'popup.html',
        });
      },
    );
  });

  describe('options', () => {
    const optionsContent = `
      <html>
        <head>
          <meta name="manifest.open_in_tab" content="false">
          <meta name="manifest.chrome_style" content="true">
          <meta name="manifest.browser_style" content="true">
        </head>
      </html>
    `;

    it('should include a options_ui and chrome_style for chrome', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/options.html', optionsContent);

      await project.build();
      const manifest = await project.getOutputManifest();

      expect(manifest.options_ui).toEqual({
        open_in_tab: false,
        chrome_style: true,
        page: 'options.html',
      });
    });

    it('should include a options_ui and browser_style for firefox', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/options.html', optionsContent);

      await project.build({ browser: 'firefox' });
      const manifest = await project.getOutputManifest(
        '.output/firefox-mv2/manifest.json',
      );

      expect(manifest.options_ui).toEqual({
        open_in_tab: false,
        browser_style: true,
        page: 'options.html',
      });
    });
  });

  describe('background', () => {
    const backgroundContent = `
      export default defineBackground({
        persistent: true,
        type: "module",
        main: () => {},
      })
    `;

    it('should include a background script for mv2', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/background.ts', backgroundContent);

      await project.build();
      const manifest = await project.getOutputManifest();

      expect(manifest.background).toEqual({
        type: 'module',
        service_worker: 'background.js',
      });
    });

    it('should include a options_ui and browser_style for firefox', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/background.ts', backgroundContent);

      await project.build({ manifestVersion: 2 });
      const manifest = await project.getOutputManifest(
        '.output/chrome-mv2/manifest.json',
      );

      expect(manifest.background).toEqual({
        persistent: true,
        scripts: ['background.js'],
      });
    });
  });

  describe('icons', () => {
    it('should auto-discover icons with the correct name', async () => {
      const project = new TestProject();
      project.addFile('public/icon-16.png');
      project.addFile('public/icon/32.jpeg');
      project.addFile('public/icon@48w.jpg');
      project.addFile('public/icon-64x64.gif');
      project.addFile('public/icon@96.bmp');
      project.addFile('public/icon/128x128.ico');

      await project.build();
      const manifest = await project.getOutputManifest();

      expect(manifest.icons).toEqual({
        '16': 'icon-16.png',
        '32': 'icon/32.jpeg',
        '48': 'icon@48w.jpg',
        '64': 'icon-64x64.gif',
        '96': 'icon@96.bmp',
        '128': 'icon/128x128.ico',
      });
    });

    it('should return undefined when no icons are found', async () => {
      const project = new TestProject();
      project.addFile('public/logo.png');
      project.addFile('public/icon.jpeg');

      await project.build();
      const manifest = await project.getOutputManifest();

      expect(manifest.icons).toBeUndefined();
    });

    it('should allow icons to be overwritten from the wxt.config.ts file', async () => {
      const project = new TestProject();
      project.addFile('public/icon-16.png');
      project.addFile('public/icon-32.png');
      project.addFile('public/logo-16.png');
      project.addFile('public/logo-32.png');
      project.addFile('public/logo-48.png');

      const icons = {
        '16': 'logo-16.png',
        '32': 'logo-32.png',
        '48': 'logo-48.png',
      };
      project.setConfigFileConfig({
        manifest: {
          icons,
        },
      });

      await project.build();
      const manifest = await project.getOutputManifest();

      expect(manifest.icons).toEqual(icons);
    });
  });

  describe('content_scripts', () => {
    it('should group content scripts and styles together based on their manifest properties', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/one.content/index.ts',
        `import "./style.css";
        export default defineContentScript({
          matches: ["*://google.com/*"],
          exclude: ["one"],
          main: () => {},
        })`,
      );
      project.addFile(
        'entrypoints/one.content/style.css',
        `body { color: red }`,
      );
      project.addFile(
        'entrypoints/two.content/index.ts',
        `import "./style.css";
        export default defineContentScript({
          matches: ["*://google.com/*"],
          runAt: "document_end",
          exclude: ["two"],
          main: () => {},
        })`,
      );
      project.addFile(
        'entrypoints/two.content/style.css',
        `body { color: green }`,
      );
      project.addFile(
        'entrypoints/three.content/index.ts',
        `import "./style.css";
        export default defineContentScript({
          matches: ["*://google.com/*"],
          runAt: "document_end",
          main: () => {},
        })`,
      );
      project.addFile(
        'entrypoints/three.content/style.css',
        `body { color: blue }`,
      );
      project.addFile(
        'entrypoints/four.content/index.ts',
        `import "./style.css";
        export default defineContentScript({
          matches: ["*://duckduckgo.com/*"],
          runAt: "document_end",
          main: () => {},
        })`,
      );
      project.addFile(
        'entrypoints/four.content/style.css',
        `body { color: yellow }`,
      );

      await project.build();

      const manifest = await project.getOutputManifest();

      expect(manifest.content_scripts).toContainEqual({
        matches: ['*://duckduckgo.com/*'],
        run_at: 'document_end',
        css: ['content-scripts/four.css'],
        js: ['content-scripts/four.js'],
      });
      expect(manifest.content_scripts).toContainEqual({
        matches: ['*://google.com/*'],
        run_at: 'document_end',
        css: ['content-scripts/three.css', 'content-scripts/two.css'],
        js: ['content-scripts/three.js', 'content-scripts/two.js'],
      });
      expect(manifest.content_scripts).toContainEqual({
        matches: ['*://google.com/*'],
        css: ['content-scripts/one.css'],
        js: ['content-scripts/one.js'],
      });
    });

    it('should add to any content scripts declared in wxt.config.ts', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/one.content/index.ts',
        `export default defineContentScript({
          matches: ["*://google.com/*"],
          main: () => {},
        })`,
      );
      project.addFile(
        'entrypoints/two.content/style.css',
        `body {
          background-color: red;
        }`,
      );
      project.setConfigFileConfig({
        manifest: {
          content_scripts: [
            {
              css: ['content-scripts/two.css'],
              matches: ['*://*.google.com/*'],
            },
          ],
        },
      });

      await project.build();

      const manifest = await project.getOutputManifest();

      expect(manifest.content_scripts).toContainEqual({
        css: ['content-scripts/two.css'],
        matches: ['*://*.google.com/*'],
      });
      expect(manifest.content_scripts).toContainEqual({
        matches: ['*://google.com/*'],
        js: ['content-scripts/one.js'],
      });
    });

    it('should add a CSS entry when cssInjectionMode is undefined', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content/style.css',
        'body { background-color: red; }',
      );
      project.addFile(
        'entrypoints/content/index.ts',
        `import "./style.css";
        
        export default defineContentScript({
          matches: ["https://*.google.com/*"],

          main() {},
        });`,
      );
      await project.build();

      expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
        .toMatchInlineSnapshot(`
          ".output/chrome-mv3/manifest.json
          ----------------------------------------
          {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"content_scripts\\":[{\\"matches\\":[\\"https://*.google.com/*\\"],\\"css\\":[\\"content-scripts/content.css\\"],\\"js\\":[\\"content-scripts/content.js\\"]}]}"
        `);
    });

    it('should add a CSS entry when cssInjectionMode is "manifest"', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content/style.css',
        'body { background-color: red; }',
      );
      project.addFile(
        'entrypoints/content/index.ts',
        `import "./style.css";
        
        export default defineContentScript({
          matches: ["https://*.google.com/*"],
          cssInjectionMode: "manifest",

          main() {},
        });`,
      );
      await project.build();

      expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
        .toMatchInlineSnapshot(`
          ".output/chrome-mv3/manifest.json
          ----------------------------------------
          {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"content_scripts\\":[{\\"matches\\":[\\"https://*.google.com/*\\"],\\"css\\":[\\"content-scripts/content.css\\"],\\"js\\":[\\"content-scripts/content.js\\"]}]}"
        `);
    });

    it('should not add an entry for CSS when cssInjectionMode is "manual"', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content/style.css',
        'body { background-color: red; }',
      );
      project.addFile(
        'entrypoints/content/index.ts',
        `import "./style.css";
        
        export default defineContentScript({
          matches: ["https://*.google.com/*"],
          cssInjectionMode: "manual",

          main() {},
        });`,
      );
      await project.build();

      expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
        .toMatchInlineSnapshot(`
        ".output/chrome-mv3/manifest.json
        ----------------------------------------
        {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"content_scripts\\":[{\\"matches\\":[\\"https://*.google.com/*\\"],\\"js\\":[\\"content-scripts/content.js\\"]}]}"
      `);
    });

    it('should not add a content script entry for CSS when cssInjectionMode is "ui", but add a web_accessible_resources entry for MV2', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content/style.css',
        'body { background-color: red; }',
      );
      project.addFile(
        'entrypoints/content/index.ts',
        `import "./style.css";
        
        export default defineContentScript({
          matches: ["https://*.google.com/*"],
          cssInjectionMode: "ui",

          main() {},
        });`,
      );
      await project.build({
        manifestVersion: 2,
      });

      expect(await project.serializeFile('.output/chrome-mv2/manifest.json'))
        .toMatchInlineSnapshot(`
          ".output/chrome-mv2/manifest.json
          ----------------------------------------
          {\\"manifest_version\\":2,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"content_scripts\\":[{\\"matches\\":[\\"https://*.google.com/*\\"],\\"js\\":[\\"content-scripts/content.js\\"]}],\\"web_accessible_resources\\":[\\"content-scripts/content.css\\"]}"
        `);
    });

    it('should not add a content script entry for CSS when cssInjectionMode is "ui", but add a web_accessible_resources entry for MV3', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content/style.css',
        'body { background-color: red; }',
      );
      project.addFile(
        'entrypoints/content/index.ts',
        `import "./style.css";
        
        export default defineContentScript({
          matches: ["https://*.google.com/*"],
          cssInjectionMode: "ui",

          main() {},
        });`,
      );
      await project.build({
        manifestVersion: 3,
      });

      expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
        .toMatchInlineSnapshot(`
          ".output/chrome-mv3/manifest.json
          ----------------------------------------
          {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"content_scripts\\":[{\\"matches\\":[\\"https://*.google.com/*\\"],\\"js\\":[\\"content-scripts/content.js\\"]}],\\"web_accessible_resources\\":[{\\"resources\\":[\\"content-scripts/content.css\\"],\\"matches\\":[\\"https://*.google.com/*\\"]}]}"
        `);
    });
  });

  it('should combine web accessible resources', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/content/style.css',
      'body { background-color: red; }',
    );
    project.addFile(
      'entrypoints/content/index.ts',
      `import "./style.css";
      
      export default defineContentScript({
        matches: ["https://*.google.com/*"],
        cssInjectionMode: "ui",

        main() {},
      });`,
    );
    project.setConfigFileConfig({
      manifest: {
        web_accessible_resources: [
          { resources: ['one.png'], matches: ['https://one.com/*'] },
        ],
      },
    });
    await project.build();

    expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
      .toMatchInlineSnapshot(`
        ".output/chrome-mv3/manifest.json
        ----------------------------------------
        {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"web_accessible_resources\\":[{\\"resources\\":[\\"one.png\\"],\\"matches\\":[\\"https://one.com/*\\"]},{\\"resources\\":[\\"content-scripts/content.css\\"],\\"matches\\":[\\"https://*.google.com/*\\"]}],\\"content_scripts\\":[{\\"matches\\":[\\"https://*.google.com/*\\"],\\"js\\":[\\"content-scripts/content.js\\"]}]}"
      `);
  });

  it('should respect the transformManifest option', async () => {
    const project = new TestProject();
    project.addFile(
      'wxt.config.ts',
      `import { defineConfig } from 'wxt';
      
      export default defineConfig({
        transformManifest(manifest) {
          manifest.author = "Custom Author"
        }
      })`,
    );

    await project.build();

    const output = await project.serializeFile(
      '.output/chrome-mv3/manifest.json',
    );
    expect(output).toMatchInlineSnapshot(`
      ".output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"author\\":\\"Custom Author\\"}"
    `);
  });

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
});
