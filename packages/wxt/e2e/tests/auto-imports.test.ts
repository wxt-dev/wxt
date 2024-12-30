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
            const ContentScriptContext: typeof import('wxt/utils/content-script-context')['ContentScriptContext']
            const InvalidMatchPattern: typeof import('wxt/utils/match-patterns')['InvalidMatchPattern']
            const MatchPattern: typeof import('wxt/utils/match-patterns')['MatchPattern']
            const browser: typeof import('wxt/browser')['browser']
            const createIframeUi: typeof import('wxt/utils/content-script-ui/iframe')['createIframeUi']
            const createIntegratedUi: typeof import('wxt/utils/content-script-ui/integrated')['createIntegratedUi']
            const createShadowRootUi: typeof import('wxt/utils/content-script-ui/shadow-root')['createShadowRootUi']
            const defineAppConfig: typeof import('wxt/utils/define-app-config')['defineAppConfig']
            const defineBackground: typeof import('wxt/utils/define-background')['defineBackground']
            const defineContentScript: typeof import('wxt/utils/define-content-script')['defineContentScript']
            const defineUnlistedScript: typeof import('wxt/utils/define-unlisted-script')['defineUnlistedScript']
            const defineWxtPlugin: typeof import('wxt/utils/define-wxt-plugin')['defineWxtPlugin']
            const fakeBrowser: typeof import('wxt/testing')['fakeBrowser']
            const injectScript: typeof import('wxt/utils/inject-script')['injectScript']
            const storage: typeof import('wxt/utils/storage')['storage']
            const useAppConfig: typeof import('wxt/utils/app-config')['useAppConfig']
          }
          // for type re-export
          declare global {
            // @ts-ignore
            export type { StorageArea, WxtStorage, WxtStorageItem, StorageItemKey, StorageAreaChanges, MigrationError } from 'wxt/utils/storage'
            import('wxt/utils/storage')
            // @ts-ignore
            export type { WxtWindowEventMap } from 'wxt/utils/content-script-context'
            import('wxt/utils/content-script-context')
            // @ts-ignore
            export type { IframeContentScriptUi, IframeContentScriptUiOptions } from 'wxt/utils/content-script-ui/iframe'
            import('wxt/utils/content-script-ui/iframe')
            // @ts-ignore
            export type { IntegratedContentScriptUi, IntegratedContentScriptUiOptions } from 'wxt/utils/content-script-ui/integrated'
            import('wxt/utils/content-script-ui/integrated')
            // @ts-ignore
            export type { ShadowRootContentScriptUi, ShadowRootContentScriptUiOptions } from 'wxt/utils/content-script-ui/shadow-root'
            import('wxt/utils/content-script-ui/shadow-root')
            // @ts-ignore
            export type { ContentScriptUi, ContentScriptUiOptions, ContentScriptOverlayAlignment, ContentScriptAppendMode, ContentScriptInlinePositioningOptions, ContentScriptOverlayPositioningOptions, ContentScriptModalPositioningOptions, ContentScriptPositioningOptions, ContentScriptAnchoredOptions, AutoMountOptions, StopAutoMount, AutoMount } from 'wxt/utils/content-script-ui/types'
            import('wxt/utils/content-script-ui/types')
            // @ts-ignore
            export type { WxtAppConfig } from 'wxt/utils/define-app-config'
            import('wxt/utils/define-app-config')
            // @ts-ignore
            export type { ScriptPublicPath, InjectScriptOptions } from 'wxt/utils/inject-script'
            import('wxt/utils/inject-script')
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
          /// <reference types="@types/chrome" />
          /// <reference types="./types/imports-module.d.ts" />
          /// <reference types="./types/imports.d.ts" />
          "
        `);
    });

    it('should generate the #imports module', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      // Project auto-imports should also be present
      project.addFile(
        'utils/time.ts',
        `export function startOfDay(date: Date): Date {
          throw Error("TODO")
        }`,
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports-module.d.ts'))
        .toMatchInlineSnapshot(`
          ".wxt/types/imports-module.d.ts
          ----------------------------------------
          // Generated by wxt
          // Types for the #import virtual module
          declare module '#imports' {
            export { browser } from 'wxt/browser';
            export { storage, StorageArea, WxtStorage, WxtStorageItem, StorageItemKey, StorageAreaChanges, MigrationError } from 'wxt/utils/storage';
            export { useAppConfig } from 'wxt/utils/app-config';
            export { ContentScriptContext, WxtWindowEventMap } from 'wxt/utils/content-script-context';
            export { createIframeUi, IframeContentScriptUi, IframeContentScriptUiOptions } from 'wxt/utils/content-script-ui/iframe';
            export { createIntegratedUi, IntegratedContentScriptUi, IntegratedContentScriptUiOptions } from 'wxt/utils/content-script-ui/integrated';
            export { createShadowRootUi, ShadowRootContentScriptUi, ShadowRootContentScriptUiOptions } from 'wxt/utils/content-script-ui/shadow-root';
            export { ContentScriptUi, ContentScriptUiOptions, ContentScriptOverlayAlignment, ContentScriptAppendMode, ContentScriptInlinePositioningOptions, ContentScriptOverlayPositioningOptions, ContentScriptModalPositioningOptions, ContentScriptPositioningOptions, ContentScriptAnchoredOptions, AutoMountOptions, StopAutoMount, AutoMount } from 'wxt/utils/content-script-ui/types';
            export { defineAppConfig, WxtAppConfig } from 'wxt/utils/define-app-config';
            export { defineBackground } from 'wxt/utils/define-background';
            export { defineContentScript } from 'wxt/utils/define-content-script';
            export { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
            export { defineWxtPlugin } from 'wxt/utils/define-wxt-plugin';
            export { injectScript, ScriptPublicPath, InjectScriptOptions } from 'wxt/utils/inject-script';
            export { InvalidMatchPattern, MatchPattern } from 'wxt/utils/match-patterns';
            export { fakeBrowser } from 'wxt/testing';
            export { startOfDay } from '../utils/time';
          }
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

    it('should only include imports-module.d.ts in the the project', async () => {
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
        /// <reference types="@types/chrome" />
        /// <reference types="./types/imports-module.d.ts" />
        "
      `,
      );
    });

    it('should only generate the #imports module', async () => {
      const project = new TestProject();
      project.setConfigFileConfig({
        imports: false,
      });
      project.addFile('entrypoints/popup.html', `<html></html>`);
      // Project auto-imports should also be present
      project.addFile(
        'utils/time.ts',
        `export function startOfDay(date: Date): Date {
              throw Error("TODO")
            }`,
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports-module.d.ts'))
        .toMatchInlineSnapshot(`
          ".wxt/types/imports-module.d.ts
          ----------------------------------------
          // Generated by wxt
          // Types for the #import virtual module
          declare module '#imports' {
            export { browser } from 'wxt/browser';
            export { storage, StorageArea, WxtStorage, WxtStorageItem, StorageItemKey, StorageAreaChanges, MigrationError } from 'wxt/utils/storage';
            export { useAppConfig } from 'wxt/utils/app-config';
            export { ContentScriptContext, WxtWindowEventMap } from 'wxt/utils/content-script-context';
            export { createIframeUi, IframeContentScriptUi, IframeContentScriptUiOptions } from 'wxt/utils/content-script-ui/iframe';
            export { createIntegratedUi, IntegratedContentScriptUi, IntegratedContentScriptUiOptions } from 'wxt/utils/content-script-ui/integrated';
            export { createShadowRootUi, ShadowRootContentScriptUi, ShadowRootContentScriptUiOptions } from 'wxt/utils/content-script-ui/shadow-root';
            export { ContentScriptUi, ContentScriptUiOptions, ContentScriptOverlayAlignment, ContentScriptAppendMode, ContentScriptInlinePositioningOptions, ContentScriptOverlayPositioningOptions, ContentScriptModalPositioningOptions, ContentScriptPositioningOptions, ContentScriptAnchoredOptions, AutoMountOptions, StopAutoMount, AutoMount } from 'wxt/utils/content-script-ui/types';
            export { defineAppConfig, WxtAppConfig } from 'wxt/utils/define-app-config';
            export { defineBackground } from 'wxt/utils/define-background';
            export { defineContentScript } from 'wxt/utils/define-content-script';
            export { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
            export { defineWxtPlugin } from 'wxt/utils/define-wxt-plugin';
            export { injectScript, ScriptPublicPath, InjectScriptOptions } from 'wxt/utils/inject-script';
            export { InvalidMatchPattern, MatchPattern } from 'wxt/utils/match-patterns';
            export { fakeBrowser } from 'wxt/testing';
          }
          "
        `);
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

    it('"enabled: false" should NOT output an ESlint config file', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare({
        imports: {
          eslintrc: {
            enabled: false,
          },
        },
      });

      expect(await project.fileExists('.wxt/eslint-auto-imports.mjs')).toBe(
        false,
      );
      expect(await project.fileExists('.wxt/eslintrc-auto-import.json')).toBe(
        false,
      );
    });

    it('should NOT output an ESlint config file by default', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);

      await project.prepare();

      expect(await project.fileExists('.wxt/eslint-auto-imports.mjs')).toBe(
        false,
      );
      expect(await project.fileExists('.wxt/eslintrc-auto-import.json')).toBe(
        false,
      );
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
