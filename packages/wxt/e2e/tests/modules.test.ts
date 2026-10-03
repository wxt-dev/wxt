import { describe, it, expect, vi } from 'vitest';
import { TestProject } from '../utils';
import type { InlineConfig, UnlistedScriptEntrypoint } from '../../src';
import { readFile } from 'node:fs/promises';
import { normalizePath } from '../../src';

describe('Module Helpers', () => {
  describe('options', () => {
    it('should receive the options defined in wxt.config.ts based on the configKey field', async () => {
      const options = { key: '123' };
      const reportOptions = vi.fn();
      vi.stubGlobal('reportOptions', reportOptions);
      const project = new TestProject();

      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {})',
      );
      project.addFile(
        'modules/test.ts',
        `
          import { defineWxtModule } from 'wxt/modules';
          import { writeFile, mkdir } from 'node:fs/promises';
          import { resolve } from 'node:path';

          export default defineWxtModule({
            configKey: "example",
            setup: async (wxt, options) => {
              reportOptions(options);
            },
          })
        `,
      );

      await project.build({
        // @ts-expect-error: untyped field for testing
        example: options,
      });

      expect(reportOptions).toBeCalledWith(options);
    });
  });

  describe('addEntrypoint', () => {
    it('should add a custom entrypoint to be bundled the project', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {})',
      );

      const entrypoint: UnlistedScriptEntrypoint = {
        type: 'unlisted-script',
        inputPath: project.resolvePath('modules/test/injected.ts'),
        name: 'injected',
        options: {},
        outputDir: project.resolvePath('.output/chrome-mv3'),
        skipped: false,
      };
      project.addFile(
        'modules/test/injected.ts',
        `export default defineUnlistedScript(() => {})`,
      );
      project.addFile(
        'modules/test/index.ts',
        `
          import { defineWxtModule, addEntrypoint } from 'wxt/modules';

          export default defineWxtModule((wxt) => {
            addEntrypoint(wxt, ${JSON.stringify(entrypoint)})
          })
        `,
      );
      const config: InlineConfig = {
        browser: 'chrome',
      };

      await project.build(config);

      expect(await project.pathExists('.output/chrome-mv3/injected.js')).toBe(
        true,
      );
    });
  });

  describe('addPublicAssets', () => {
    it('should add public assets', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {})',
      );

      project.addFile('modules/test/public/module.txt');
      const dir = project.resolvePath('modules/test/public');
      project.addFile(
        'modules/test/index.ts',
        `
          import { defineWxtModule, addPublicAssets } from 'wxt/modules'
          import { resolve } from 'node:path'

          export default defineWxtModule((wxt) => {
            addPublicAssets(wxt, "${normalizePath(dir)}")
            wxt.hooks.hook("build:publicAssets", (_, assets) => {
              assets.push({
                relativeDest: "example/generated.txt",
                contents: "",
              });
            });
          });
        `,
      );

      const res = await project.build();

      expect(res.publicAssets).toContainEqual({
        type: 'asset',
        fileName: 'module.txt',
      });
      await expect(
        project.pathExists('.output/chrome-mv3/module.txt'),
      ).resolves.toBe(true);
      await expect(
        project.pathExists('.output/chrome-mv3/example/generated.txt'),
      ).resolves.toBe(true);
    });

    it("should not overwrite the user's public files", async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {})',
      );

      project.addFile('public/user.txt', 'from-user');
      project.addFile('modules/test/public/user.txt', 'from-module');
      const dir = project.resolvePath('modules/test/public');
      project.addFile(
        'modules/test/index.ts',
        `
          import { defineWxtModule, addPublicAssets } from 'wxt/modules'
          import { resolve } from 'node:path'

          export default defineWxtModule((wxt) => {
            addPublicAssets(wxt, "${normalizePath(dir)}")
          })
        `,
      );

      const res = await project.build();

      expect(res.publicAssets).toContainEqual({
        type: 'asset',
        fileName: 'user.txt',
      });
      await expect(
        readFile(project.resolvePath('.output/chrome-mv3/user.txt'), 'utf8'),
      ).resolves.toBe('from-user');
    });
  });

  describe('addWxtPlugin', () => {
    function addPluginModule(project: TestProject) {
      const expectedText = 'Hello from plugin!';
      const pluginPath = project.addFile(
        'modules/test/client-plugin.ts',
        `
          export default defineWxtPlugin(() => {
            console.log("${expectedText}")
          })
        `,
      );
      project.addFile(
        'modules/test.ts',
        `
          import { defineWxtModule, addWxtPlugin } from 'wxt/modules';

          export default defineWxtModule((wxt) => {
            addWxtPlugin(wxt, "${normalizePath(pluginPath)}");
          });
        `,
      );
      return expectedText;
    }

    it('should include the plugin in the background', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {})',
      );
      const expectedText = addPluginModule(project);

      await project.build();

      await expect(project.serializeOutput()).resolves.toContain(expectedText);
    });

    it('should include the plugin in HTML entrypoints', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/popup/index.html',
        `
          <html>
            <body></body>
          </html>
        `,
      );
      const expectedText = addPluginModule(project);

      await project.build();

      await expect(project.serializeOutput()).resolves.toContain(expectedText);
    });

    it('should include the plugin in content scripts', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.ts',
        `
          export default defineContentScript({
            matches: ["*://*/*"],
            main: () => {},
          })
        `,
      );
      const expectedText = addPluginModule(project);

      await project.build();

      await expect(project.serializeOutput()).resolves.toContain(expectedText);
    });

    it('should include the plugin in unlisted scripts', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/unlisted.ts',
        'export default defineUnlistedScript(() => {})',
      );
      const expectedText = addPluginModule(project);

      await project.build();

      await expect(project.serializeOutput()).resolves.toContain(expectedText);
    });

    it('should apply plugins only to entrypoints matching their filter', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/background.ts',
        'export default defineBackground(() => {})',
      );
      project.addFile(
        'entrypoints/content.ts',
        `
          export default defineContentScript({
            matches: ["*://*/*"],
            main: () => {},
          })
        `,
      );
      project.addFile('entrypoints/popup/index.html', '<html></html>');
      project.addFile('entrypoints/options/index.html', '<html></html>');

      const backgroundPluginPath = project.addFile(
        'modules/test/background-plugin.ts',
        `export default defineWxtPlugin(() => console.log("BACKGROUND_PLUGIN"))`,
      );
      const popupPluginPath = project.addFile(
        'modules/test/popup-plugin.ts',
        `export default defineWxtPlugin(() => console.log("POPUP_PLUGIN"))`,
      );
      project.addFile(
        'modules/test.ts',
        `
          import { defineWxtModule, addWxtPlugin } from 'wxt/modules';

          export default defineWxtModule((wxt) => {
            addWxtPlugin(wxt, "${normalizePath(backgroundPluginPath)}", (entrypoint) => entrypoint.type === 'background');
            addWxtPlugin(wxt, "${normalizePath(popupPluginPath)}", (entrypoint) => entrypoint.name === 'popup');
          });
        `,
      );

      await project.build();

      await expect(
        project.serializeFile('.output/chrome-mv3/background.js'),
      ).resolves.toContain('BACKGROUND_PLUGIN');
      await expect(
        project.serializeFile('.output/chrome-mv3/content-scripts/content.js'),
      ).resolves.not.toContain('BACKGROUND_PLUGIN');

      const getInjectedScript = async (htmlFile: string) => {
        const html = await readFile(
          project.resolvePath('.output/chrome-mv3', htmlFile),
          'utf-8',
        );
        const match = html.match(/<script[^>]*\ssrc="([^"]+)"/);
        if (!match) throw Error(`No script tag in ${htmlFile}`);
        return readFile(
          project.resolvePath(
            '.output/chrome-mv3',
            match[1].replace(/^\//, ''),
          ),
          'utf-8',
        );
      };

      await expect(getInjectedScript('popup.html')).resolves.toContain(
        'POPUP_PLUGIN',
      );
      await expect(getInjectedScript('options.html')).resolves.not.toContain(
        'POPUP_PLUGIN',
      );
    });
  });

  describe('imports', () => {
    it('should add auto-imports', async () => {
      const expectedText = 'customImport!';
      const project = new TestProject();
      project.addFile(
        'entrypoints/background.ts',
        `export default defineBackground(() => {
          customImport();
        });`,
      );
      const utils = project.addFile(
        'custom.ts',
        `export function customImport() {
          console.log("${expectedText}")
        }`,
      );
      project.addFile(
        'modules/test.ts',
        `import { defineWxtModule } from 'wxt/modules';

        export default defineWxtModule({
          imports: [
            { name: 'customImport', from: '${normalizePath(utils)}' },
          ],
        })`,
      );

      await project.build();

      await expect(project.serializeOutput()).resolves.toContain(expectedText);
    });

    it('should add preset', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/background.ts',
        `export default defineBackground(() => {
            customImport();
          });`,
      );
      project.addFile(
        'modules/test.ts',
        `import { defineWxtModule, addImportPreset } from 'wxt/modules';

        export default defineWxtModule((wxt) => {
          addImportPreset(wxt, "vue");
        })`,
      );

      await project.build();

      await expect(
        project.serializeFile('.wxt/types/imports.d.ts'),
      ).resolves.toContain("const ref: typeof import('vue').ref");
    });
  });
});
