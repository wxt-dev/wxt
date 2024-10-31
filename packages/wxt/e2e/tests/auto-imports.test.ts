import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';
import spawn from 'nano-spawn';

describe('Auto Imports', () => {
  describe('imports: { ... }', () => {
    it('should generate a declaration file, imports.d.ts, for auto-imports', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts'))
        .toMatchInlineSnapshot(`
          ".wxt/types/imports.d.ts
          ----------------------------------------
          // Generated by wxt
          export {}
          declare global {
            const ContentScriptContext: typeof import('wxt/client')['ContentScriptContext']
            const InvalidMatchPattern: typeof import('wxt/sandbox')['InvalidMatchPattern']
            const MatchPattern: typeof import('wxt/sandbox')['MatchPattern']
            const MigrationError: typeof import('wxt/storage')['MigrationError']
            const browser: typeof import('wxt/browser')['browser']
            const createIframeUi: typeof import('wxt/client')['createIframeUi']
            const createIntegratedUi: typeof import('wxt/client')['createIntegratedUi']
            const createShadowRootUi: typeof import('wxt/client')['createShadowRootUi']
            const defineAppConfig: typeof import('wxt/sandbox')['defineAppConfig']
            const defineBackground: typeof import('wxt/sandbox')['defineBackground']
            const defineConfig: typeof import('wxt')['defineConfig']
            const defineContentScript: typeof import('wxt/sandbox')['defineContentScript']
            const defineUnlistedScript: typeof import('wxt/sandbox')['defineUnlistedScript']
            const defineWxtPlugin: typeof import('wxt/sandbox')['defineWxtPlugin']
            const fakeBrowser: typeof import('wxt/testing')['fakeBrowser']
            const injectScript: typeof import('wxt/client')['injectScript']
            const storage: typeof import('wxt/storage')['storage']
            const useAppConfig: typeof import('wxt/client')['useAppConfig']
          }
          "
        `);
    });

    it('should include auto-imports in the project', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare();

      expect(await project.serializeFile('.wxt/wxt.d.ts'))
        .toMatchInlineSnapshot(`
          ".wxt/wxt.d.ts
          ----------------------------------------
          // Generated by wxt
          /// <reference types="wxt/vite-builder-env" />
          /// <reference types="./types/paths.d.ts" />
          /// <reference types="./types/i18n.d.ts" />
          /// <reference types="./types/globals.d.ts" />
          /// <reference types="./types/imports.d.ts" />
          "
        `);
    });
  });

  describe('imports: false', () => {
    it('should not generate a imports.d.ts file', async () => {
      const project = new TestProject();
      project.setConfigFileConfig({
        imports: false,
      });
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare();

      expect(await project.fileExists('.wxt/types/imports.d.ts')).toBe(false);
    });

    it('should not include imports.d.ts in the type references', async () => {
      const project = new TestProject();
      project.setConfigFileConfig({
        imports: false,
      });
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare();

      expect(
        await project.serializeFile('.wxt/wxt.d.ts'),
      ).toMatchInlineSnapshot(
        `
        ".wxt/wxt.d.ts
        ----------------------------------------
        // Generated by wxt
        /// <reference types="wxt/vite-builder-env" />
        /// <reference types="./types/paths.d.ts" />
        /// <reference types="./types/i18n.d.ts" />
        /// <reference types="./types/globals.d.ts" />
        "
      `,
      );
    });
  });

  describe('eslintrc', () => {
    it('"enabled: true" should output a JSON config file compatible with ESlint 8', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare({
        imports: {
          eslintrc: {
            enabled: true,
          },
        },
      });

      expect(
        await project.serializeFile('.wxt/eslintrc-auto-import.json'),
      ).toMatchSnapshot();
    });

    it('"enabled: 8" should output a JSON config file compatible with ESlint 8', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare({
        imports: {
          eslintrc: {
            enabled: 8,
          },
        },
      });

      expect(
        await project.serializeFile('.wxt/eslintrc-auto-import.json'),
      ).toMatchSnapshot();
    });

    it('"enabled: 9" should output a flat config file compatible with ESlint 9', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare({
        imports: {
          eslintrc: {
            enabled: 9,
          },
        },
      });

      expect(
        await project.serializeFile('.wxt/eslint-auto-imports.mjs'),
      ).toMatchSnapshot();
    });

    it('should allow customizing the output', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare({
        imports: {
          eslintrc: {
            enabled: true,
            filePath: project.resolvePath('example.json'),
            globalsPropValue: 'readonly',
          },
        },
      });

      expect(await project.serializeFile('example.json')).toMatchSnapshot();
    });

    describe('Actual linting results', () => {
      async function runEslint(
        project: TestProject,
        version: boolean | 'auto' | 8 | 9,
      ) {
        project.addFile(
          'entrypoints/background.js',
          `export default defineBackground(() => {})`,
        );
        await project.prepare({
          imports: { eslintrc: { enabled: version } },
        });
        return await spawn('pnpm', ['eslint', 'entrypoints/background.js'], {
          cwd: project.root,
        });
      }

      describe('ESLint 9', () => {
        it('should have lint errors when not extending generated config', async () => {
          const project = new TestProject({
            devDependencies: {
              '@eslint/js': '9.5.0',
              eslint: '9.5.0',
            },
          });
          project.addFile(
            'eslint.config.mjs',
            `
            import eslint from "@eslint/js";

            export default [
              eslint.configs.recommended,
            ];
            `,
          );

          await expect(runEslint(project, 9)).rejects.toMatchObject({
            exitCode: 1,
            stdout: expect.stringContaining(
              "'defineBackground' is not defined",
            ),
          });
        });

        it('should not have any lint errors when configured', async () => {
          const project = new TestProject({
            devDependencies: {
              '@eslint/js': '9.5.0',
              eslint: '9.5.0',
            },
          });
          project.addFile(
            'eslint.config.mjs',
            `
            import eslint from "@eslint/js";
            import autoImports from "./.wxt/eslint-auto-imports.mjs";

            export default [
              eslint.configs.recommended,
              autoImports,
            ];
            `,
          );
          const res = await runEslint(project, 9);

          expect(res).toBeDefined();
        });
      });

      describe('ESLint 8', () => {
        it('should have lint errors when not extending generated config', async () => {
          const project = new TestProject({
            devDependencies: {
              eslint: '8.57.0',
            },
          });
          project.addFile(
            '.eslintrc',
            JSON.stringify({
              parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
              env: { es6: true },
              extends: ['eslint:recommended'],
            }),
          );

          await expect(runEslint(project, 8)).rejects.toMatchObject({
            exitCode: 1,
            stdout: expect.stringContaining(
              "'defineBackground' is not defined",
            ),
          });
        });

        it('should not have any lint errors when configured', async () => {
          const project = new TestProject({
            devDependencies: {
              eslint: '8.57.0',
            },
          });
          project.addFile(
            '.eslintrc',
            JSON.stringify({
              parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
              env: { es6: true },
              extends: [
                'eslint:recommended',
                './.wxt/eslintrc-auto-import.json',
              ],
            }),
          );
          const res = await runEslint(project, 8);

          expect(res).toBeDefined();
        });
      });
    });
  });
});
