import { describe, expect, it } from 'vitest';
import { generateMainfest } from '../manifest';
import {
  fakeArray,
  fakeBuildOutput,
  fakeEntrypoint,
  fakeInternalConfig,
} from '../testing/fake-objects';

describe('Manifest Utils', () => {
  describe('generateManifest', () => {
    describe('popup', () => {
      type ActionType = 'browser_action' | 'page_action';
      const popupContent = (type?: ActionType) => `
        <html>
          <head>
            ${
              type == null
                ? ''
                : `<meta name="manifest.type" content="${type}">`
            }
            <meta name="manifest.default_icon" content="{ '16': '/icon/16.png' }">
            <title>Default Title</title>
          </head>
        </html>
      `;

      it.todo('should include an action for mv3', async () => {
        // const project = new TestProject();
        // project.addFile('entrypoints/popup.html', popupContent());
        //
        // await project.build();
        //
        // const manifest = await project.getOutputManifest();
        // expect(manifest.action).toEqual({
        //   default_icon: { '16': '/icon/16.png' },
        //   default_title: 'Default Title',
        //   default_popup: 'popup.html',
        // });
      });

      it.todo.each<{
        inputType: ActionType | undefined;
        expectedType: ActionType;
      }>([
        { inputType: undefined, expectedType: 'browser_action' },
        { inputType: 'browser_action', expectedType: 'browser_action' },
        { inputType: 'page_action', expectedType: 'page_action' },
      ])(
        'should include a browser_action or page_action for mv2: %j',
        async ({ inputType, expectedType }) => {
          // const project = new TestProject();
          // project.addFile('entrypoints/popup.html', popupContent(type));
          //
          // await project.build({ manifestVersion: 2 });
          //
          // const manifest = await project.getOutputManifest(
          //   '.output/chrome-mv2/manifest.json',
          // );
          // expect(manifest[expectedType]).toEqual({
          //   default_icon: { '16': '/icon/16.png' },
          //   default_title: 'Default Title',
          //   default_popup: 'popup.html',
          // });
        },
      );

      it.todo('should ', async () => {});

      it.todo('should ', async () => {});

      it.todo('should ', async () => {});

      it.todo('should ', async () => {});
    });

    describe('action without popup', () => {
      it('should respect the action field in the manifest without a popup', async () => {
        // const project = new TestProject();
        // project.addFile('entrypoints/unlisted.html');
        // project.setConfigFileConfig({
        //   manifest: {
        //     action: {
        //       default_title: 'Hello world',
        //     },
        //   },
        // });
        //
        // await project.build();
        //
        // expect(await project.getOutputManifest()).toMatchInlineSnapshot(`
        //   {
        //     "action": {
        //       "default_title": "Hello world",
        //     },
        //     "description": "Example description",
        //     "manifest_version": 3,
        //     "name": "E2E Extension",
        //     "version": "0.0.0",
        //   }
        // `);
      });
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

      it.todo(
        'should include a options_ui and chrome_style for chrome',
        async () => {
          // const project = new TestProject();
          // project.addFile('entrypoints/options.html', optionsContent);
          //
          // await project.build();
          // const manifest = await project.getOutputManifest();
          //
          // expect(manifest.options_ui).toEqual({
          //   open_in_tab: false,
          //   chrome_style: true,
          //   page: 'options.html',
          // });
        },
      );

      it.todo(
        'should include a options_ui and browser_style for firefox',
        async () => {
          // const project = new TestProject();
          // project.addFile('entrypoints/options.html', optionsContent);
          //
          // await project.build({ browser: 'firefox' });
          // const manifest = await project.getOutputManifest(
          //   '.output/firefox-mv2/manifest.json',
          // );
          //
          // expect(manifest.options_ui).toEqual({
          //   open_in_tab: false,
          //   browser_style: true,
          //   page: 'options.html',
          // });
        },
      );
    });

    describe('background', () => {
      const backgroundContent = `
        export default defineBackground({
          persistent: true,
          type: "module",
          main: () => {},
        })
      `;

      describe('MV3', () => {
        it.todo.each(['chrome', 'safari'])(
          'should include scripts and persistent for %s',
          async (browser) => {
            // const project = new TestProject();
            // project.addFile('entrypoints/background.ts', backgroundContent);
            //
            // await project.build({ browser, manifestVersion: 2 });
            // const manifest = await project.getOutputManifest(
            //   `.output/${browser}-mv2/manifest.json`,
            // );
            //
            // expect(manifest.background).toEqual({
            //   persistent: true,
            //   scripts: ['background.js'],
            // });
          },
        );

        it.todo(
          'should include a background script and type for firefox',
          async () => {
            // const project = new TestProject();
            // project.addFile('entrypoints/background.ts', backgroundContent);
            //
            // await project.build({ browser: 'firefox', manifestVersion: 3 });
            // const manifest = await project.getOutputManifest(
            //   '.output/firefox-mv3/manifest.json',
            // );
            //
            // expect(manifest.background).toEqual({
            //   type: 'module',
            //   scripts: ['background.js'],
            // });
          },
        );
      });

      describe('MV2', () => {
        it.todo.each(['chrome', 'safari'])(
          'should include a service worker and type for %s mv3',
          async (browser) => {
            // const project = new TestProject();
            // project.addFile('entrypoints/background.ts', backgroundContent);
            //
            // await project.build({ browser, manifestVersion: 3 });
            // const manifest = await project.getOutputManifest(
            //   `.output/${browser}-mv3/manifest.json`,
            // );
            //
            // expect(manifest.background).toEqual({
            //   type: 'module',
            //   service_worker: 'background.js',
            // });
          },
        );

        it.todo(
          'should include a background script and persistent for firefox mv2',
          async () => {
            // const project = new TestProject();
            // project.addFile('entrypoints/background.ts', backgroundContent);
            //
            // await project.build({ browser: 'firefox', manifestVersion: 2 });
            // const manifest = await project.getOutputManifest(
            //   '.output/firefox-mv2/manifest.json',
            // );
            //
            // expect(manifest.background).toEqual({
            //   persistent: true,
            //   scripts: ['background.js'],
            // });
          },
        );
      });
    });

    describe('icons', () => {
      it.todo('should auto-discover icons with the correct name', async () => {
        // const project = new TestProject();
        // project.addFile('entrypoints/unlisted.html');
        // project.addFile('public/icon-16.png');
        // project.addFile('public/icon/32.png');
        // project.addFile('public/icon@48w.png');
        // project.addFile('public/icon-64x64.png');
        // project.addFile('public/icon@96.png');
        // project.addFile('public/icons/128x128.png');
        // await project.build();
        // const manifest = await project.getOutputManifest();
        // expect(manifest.icons).toEqual({
        //   '16': 'icon-16.png',
        //   '32': 'icon/32.png',
        //   '48': 'icon@48w.png',
        //   '64': 'icon-64x64.png',
        //   '96': 'icon@96.png',
        //   '128': 'icons/128x128.png',
        // });
      });

      it.todo('should return undefined when no icons are found', async () => {
        // const project = new TestProject();
        // project.addFile('entrypoints/unlisted.html');
        // project.addFile('public/logo.png');
        // project.addFile('public/icon.jpeg');
        //
        // await project.build();
        // const manifest = await project.getOutputManifest();
        //
        // expect(manifest.icons).toBeUndefined();
      });

      it.todo(
        'should allow icons to be overwritten from the wxt.config.ts file',
        async () => {
          // const project = new TestProject();
          // project.addFile('entrypoints/unlisted.html');
          // project.addFile('public/icon-16.png');
          // project.addFile('public/icon-32.png');
          // project.addFile('public/logo-16.png');
          // project.addFile('public/logo-32.png');
          // project.addFile('public/logo-48.png');
          //
          // const icons = {
          //   '16': 'logo-16.png',
          //   '32': 'logo-32.png',
          //   '48': 'logo-48.png',
          // };
          // project.setConfigFileConfig({
          //   manifest: {
          //     icons,
          //   },
          // });
          //
          // await project.build();
          // const manifest = await project.getOutputManifest();
          //
          // expect(manifest.icons).toEqual(icons);
        },
      );
    });

    describe('content_scripts', () => {
      it.todo(
        'should group content scripts and styles together based on their manifest properties',
        async () => {
          //   const project = new TestProject();
          //   project.addFile(
          //     'entrypoints/one.content/index.ts',
          //     `import "./style.css";
          // export default defineContentScript({
          //   matches: ["*://google.com/*"],
          //   main: () => {},
          // })`,
          //   );
          //   project.addFile(
          //     'entrypoints/one.content/style.css',
          //     `body { color: red }`,
          //   );
          //   project.addFile(
          //     'entrypoints/two.content/index.ts',
          //     `import "./style.css";
          // export default defineContentScript({
          //   matches: ["*://google.com/*"],
          //   runAt: "document_end",
          //   main: () => {},
          // })`,
          //   );
          //   project.addFile(
          //     'entrypoints/two.content/style.css',
          //     `body { color: green }`,
          //   );
          //   project.addFile(
          //     'entrypoints/three.content/index.ts',
          //     `import "./style.css";
          // export default defineContentScript({
          //   matches: ["*://google.com/*"],
          //   runAt: "document_end",
          //   main: () => {},
          // })`,
          //   );
          //   project.addFile(
          //     'entrypoints/three.content/style.css',
          //     `body { color: blue }`,
          //   );
          //   project.addFile(
          //     'entrypoints/four.content/index.ts',
          //     `import "./style.css";
          // export default defineContentScript({
          //   matches: ["*://duckduckgo.com/*"],
          //   runAt: "document_end",
          //   main: () => {},
          // })`,
          //   );
          //   project.addFile(
          //     'entrypoints/four.content/style.css',
          //     `body { color: yellow }`,
          //   );
          //
          //   await project.build();
          //
          //   const manifest = await project.getOutputManifest();
          //
          //   expect(manifest.content_scripts).toContainEqual({
          //     matches: ['*://duckduckgo.com/*'],
          //     run_at: 'document_end',
          //     css: ['content-scripts/four.css'],
          //     js: ['content-scripts/four.js'],
          //   });
          //   expect(manifest.content_scripts).toContainEqual({
          //     matches: ['*://google.com/*'],
          //     run_at: 'document_end',
          //     css: ['content-scripts/three.css', 'content-scripts/two.css'],
          //     js: ['content-scripts/three.js', 'content-scripts/two.js'],
          //   });
          //   expect(manifest.content_scripts).toContainEqual({
          //     matches: ['*://google.com/*'],
          //     css: ['content-scripts/one.css'],
          //     js: ['content-scripts/one.js'],
          //   });
        },
      );

      it.todo(
        'should add to any content scripts declared in wxt.config.ts',
        async () => {
          //   const project = new TestProject();
          //   project.addFile(
          //     'entrypoints/one.content/index.ts',
          //     `export default defineContentScript({
          //   matches: ["*://google.com/*"],
          //   main: () => {},
          // })`,
          //   );
          //   project.addFile(
          //     'entrypoints/two.content/style.css',
          //     `body {
          //   background-color: red;
          // }`,
          //   );
          //   project.setConfigFileConfig({
          //     manifest: {
          //       content_scripts: [
          //         {
          //           css: ['content-scripts/two.css'],
          //           matches: ['*://*.google.com/*'],
          //         },
          //       ],
          //     },
          //   });
          //
          //   await project.build();
          //
          //   const manifest = await project.getOutputManifest();
          //
          //   expect(manifest.content_scripts).toContainEqual({
          //     css: ['content-scripts/two.css'],
          //     matches: ['*://*.google.com/*'],
          //   });
          //   expect(manifest.content_scripts).toContainEqual({
          //     matches: ['*://google.com/*'],
          //     js: ['content-scripts/one.js'],
          //   });
        },
      );

      describe('cssInjectionMode', () => {
        it.todo.each([undefined, '"manifest"'])(
          'should add a CSS entry when cssInjectionMode is %s',
          async (cssInjectionMode) => {
            //     const project = new TestProject();
            //     project.addFile(
            //       'entrypoints/content/style.css',
            //       'body { background-color: red; }',
            //     );
            //     project.addFile(
            //       'entrypoints/content/index.ts',
            //       `import "./style.css";
            //
            // export default defineContentScript({
            //   matches: ["https://*.google.com/*"],
            //
            //   main() {},
            // });`,
            //     );
            //     await project.build();
            //
            //     expect(
            //       await project.serializeFile('.output/chrome-mv3/manifest.json'),
            //     ).toMatchInlineSnapshot(`
            //   ".output/chrome-mv3/manifest.json
            //   ----------------------------------------
            //   {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","content_scripts":[{"matches":["https://*.google.com/*"],"css":["content-scripts/content.css"],"js":["content-scripts/content.js"]}]}"
            // `);
          },
        );

        it.each(['"manual"', '"ui"'])(
          'should not add an entry for CSS when cssInjectionMode is %s',
          async (cssInjectionMode) => {
            // const project = new TestProject();
            // project.addFile(
            //   'entrypoints/content/style.css',
            //   'body { background-color: red; }',
            // );
            // project.addFile(
            //   'entrypoints/content/index.ts',
            //   `import "./style.css";
            //
            //   export default defineContentScript({
            //     matches: ["https://*.google.com/*"],
            //     cssInjectionMode: "manual",
            //
            //     main() {},
            //   });`,
            // );
            // await project.build();
            //
            // expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
            //   .toMatchInlineSnapshot(`
            //     ".output/chrome-mv3/manifest.json
            //     ----------------------------------------
            //     {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","content_scripts":[{"matches":["https://*.google.com/*"],"js":["content-scripts/content.js"]}]}"
            //   `);
          },
        );

        it.todo(
          'should add CSS file to `web_accessible_resources` when cssInjectionMode is "ui" for MV3',
          async () => {
            // const project = new TestProject();
            // project.addFile(
            //   'entrypoints/content/style.css',
            //   'body { background-color: red; }',
            // );
            // project.addFile(
            //   'entrypoints/content/index.ts',
            //   `import "./style.css";
            //
            //   export default defineContentScript({
            //     matches: ["https://*.google.com/*"],
            //     cssInjectionMode: "ui",
            //
            //     main() {},
            //   });`,
            // );
            // await project.build({
            //   manifestVersion: 3,
            // });
            //
            // expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
            //   .toMatchInlineSnapshot(`
            //     ".output/chrome-mv3/manifest.json
            //     ----------------------------------------
            //     {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","content_scripts":[{"matches":["https://*.google.com/*"],"js":["content-scripts/content.js"]}],"web_accessible_resources":[{"resources":["content-scripts/content.css"],"matches":["https://*.google.com/*"]}]}"
            //   `);
          },
        );

        it.todo(
          'should add CSS file to `web_accessible_resources` when cssInjectionMode is "ui" for MV2',
          async () => {
            //     const project = new TestProject();
            //     project.addFile(
            //       'entrypoints/content/style.css',
            //       'body { background-color: red; }',
            //     );
            //     project.addFile(
            //       'entrypoints/content/index.ts',
            //       `import "./style.css";
            //
            // export default defineContentScript({
            //   matches: ["https://*.google.com/*"],
            //   cssInjectionMode: "ui",
            //
            //   main() {},
            // });`,
            //     );
            //     await project.build({
            //       manifestVersion: 3,
            //     });
            //
            //     expect(
            //       await project.serializeFile('.output/chrome-mv3/manifest.json'),
            //     ).toMatchInlineSnapshot(`
            //   ".output/chrome-mv3/manifest.json
            //   ----------------------------------------
            //   {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","content_scripts":[{"matches":["https://*.google.com/*"],"js":["content-scripts/content.js"]}],"web_accessible_resources":[{"resources":["content-scripts/content.css"],"matches":["https://*.google.com/*"]}]}"
            // `);
          },
        );
      });
    });

    describe('web_accessible_resources', () => {
      it.todo(
        'should combine user defined resources and generated resources',
        async () => {
          //     const project = new TestProject();
          //     project.addFile(
          //       'entrypoints/content/style.css',
          //       'body { background-color: red; }',
          //     );
          //     project.addFile(
          //       'entrypoints/content/index.ts',
          //       `import "./style.css";
          // export default defineContentScript({
          //   matches: ["https://*.google.com/*"],
          //   cssInjectionMode: "ui",
          //   main() {},
          // });`,
          //     );
          //     project.setConfigFileConfig({
          //       manifest: {
          //         web_accessible_resources: [
          //           { resources: ['one.png'], matches: ['https://one.com/*'] },
          //         ],
          //       },
          //     });
          //     await project.build();
          //     expect(
          //       await project.serializeFile('.output/chrome-mv3/manifest.json'),
          //     ).toMatchInlineSnapshot(`
          //   ".output/chrome-mv3/manifest.json
          //   ----------------------------------------
          //   {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","web_accessible_resources":[{"resources":["one.png"],"matches":["https://one.com/*"]},{"resources":["content-scripts/content.css"],"matches":["https://*.google.com/*"]}],"content_scripts":[{"matches":["https://*.google.com/*"],"js":["content-scripts/content.js"]}]}"
          // `);
        },
      );
    });

    describe('transformManifest option', () => {
      it.todo(
        "should call the transformManifest option after the manifest is generated, but before it's returned",
        async () => {
          //   const project = new TestProject();
          //   project.addFile('entrypoints/unlisted.html');
          //   project.addFile(
          //     'wxt.config.ts',
          //     `import { defineConfig } from 'wxt';
          //
          //   export default defineConfig({
          //     transformManifest(manifest) {
          //       manifest.author = "Custom Author"
          //     }
          //   })`,
          //   );
          //
          //   await project.build();
          //
          //   const output = await project.serializeFile(
          //     '.output/chrome-mv3/manifest.json',
          //   );
          //   // TODO: Ensure transformManifest is called with fully generated manifest
          //   expect(output).toMatchInlineSnapshot(`
          //   ".output/chrome-mv3/manifest.json
          //   ----------------------------------------
          //   {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","author":"Custom Author"}"
          // `);
        },
      );

      it.todo('should ', async () => {});
    });

    describe('version', () => {
      it.each([
        ['chrome', 3] as const,
        ['safari', 2] as const,
        ['edge', 3] as const,
      ])(
        'should include version_name on %s when it needs simplified',
        async (browser, manifestVersion) => {
          // const project = new TestProject({
          //   version: '1.0.0-alpha1',
          // });
          // project.addFile('entrypoints/unlisted.html');
          //
          // await project.build({ browser, manifestVersion });
          // const manifest = await project.getOutputManifest(
          //   `.output/${browser}-mv${manifestVersion}/manifest.json`,
          // );
          //
          // expect(manifest.version).toBe('1.0.0');
          // expect(manifest.version_name).toBe('1.0.0-alpha1');
        },
      );

      it.each([['firefox', 2] as const])(
        "should not include a version_name on %s because the browser doesn't support it",
        async (browser, manifestVersion) => {
          // const project = new TestProject({
          //   version: '1.0.0-alpha1',
          // });
          // project.addFile('entrypoints/unlisted.html');
          //
          // await project.build({ browser, manifestVersion });
          // const manifest = await project.getOutputManifest(
          //   `.output/${browser}-mv${manifestVersion}/manifest.json`,
          // );
          //
          // expect(manifest.version).toBe('1.0.0');
          // expect(manifest.version_name).toBeUndefined();
        },
      );

      it.each([
        ['chrome', 3] as const,
        ['firefox', 2] as const,
        ['safari', 3] as const,
        ['edge', 3] as const,
      ])(
        'should not include the version_name if it is equal to version',
        async (browser, manifestVersion) => {
          // const project = new TestProject({
          //   version: '1.0.0.1',
          // });
          // project.addFile('entrypoints/unlisted.html');
          //
          // await project.build({ browser, manifestVersion });
          // const manifest = await project.getOutputManifest(
          //   `.output/${browser}-mv${manifestVersion}/manifest.json`,
          // );
          //
          // expect(manifest.version).toBe('1.0.0.1');
          // expect(manifest.version_name).toBeUndefined();
        },
      );
    });

    describe('', () => {
      it.todo('should ', async () => {});

      it.todo('should ', async () => {});

      it.todo('should ', async () => {});
    });

    describe('commands', () => {
      const reloadCommandName = 'wxt:reload-extension';
      const reloadCommand = {
        suggested_key: {
          default: 'Ctrl+E',
        },
      };

      it('should include a command for reloading the extension during development', async () => {
        const config = fakeInternalConfig({ command: 'serve' });
        const output = fakeBuildOutput();
        const entrypoints = fakeArray(fakeEntrypoint);

        const actual = await generateMainfest(entrypoints, output, config);

        expect(actual.commands).toMatchObject({
          [reloadCommandName]: reloadCommand,
        });
      });

      it('should not override any existing commands when adding the one to reload the extension', async () => {
        const customCommandName = 'custom-command';
        const customCommand = {
          description: 'Some other command',
          suggested_key: {
            default: 'Ctrl+H',
          },
        };
        const config = fakeInternalConfig({
          command: 'serve',
          manifest: {
            commands: {
              [customCommandName]: customCommand,
            },
          },
        });
        const output = fakeBuildOutput();
        const entrypoints = fakeArray(fakeEntrypoint);

        const actual = await generateMainfest(entrypoints, output, config);

        expect(actual.commands).toMatchObject({
          [reloadCommandName]: reloadCommand,
          [customCommandName]: customCommand,
        });
      });

      it('should not include the command when building an extension', async () => {
        const config = fakeInternalConfig({ command: 'build' });
        const output = fakeBuildOutput();
        const entrypoints = fakeArray(fakeEntrypoint);

        const actual = await generateMainfest(entrypoints, output, config);

        expect(actual.commands).toBeUndefined();
      });
    });
  });
});
