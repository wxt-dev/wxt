import { afterEach, describe, expect, it } from 'vitest';
import { readFile } from 'fs/promises';
import { resolve } from 'node:path';
import { type BrowserContext, chromium } from 'playwright';
import {
  buildProject,
  collectConsoleLogs,
  launchFirefoxWithExtension,
} from '@/utils/test-helpers.ts';

const wxtDemoEntrypointsDir = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'src',
  'entrypoints',
);
const contentPath = resolve(wxtDemoEntrypointsDir, 'content.ts');
const unlistedPath = resolve(wxtDemoEntrypointsDir, 'unlisted.ts');

const contentSource = await readFile(contentPath, 'utf-8');
const unlistedSource = await readFile(unlistedPath, 'utf-8');

describe('Content Script with injectScript', () => {
  it('should verify content.ts source code matches expected', async () => {
    expect(contentSource).toMatchInlineSnapshot(`
      "export default defineContentScript({
        matches: ['*://*.example.com/*'],

        async main() {
          console.log('Injecting...');
          await injectScript('/unlisted.js', {
            keepInDom: true,
          });
          console.log('After injection');
        },
      });
      "
    `);
  });

  it('should verify unlisted.ts source code matches expected', async () => {
    expect(unlistedSource).toMatchInlineSnapshot(`
      "export default defineUnlistedScript(() => {
        console.log('Injected');
      });
      "
    `);
  });

  describe('Browser Console Verification', () => {
    const expectedLogs = ['Injecting...', 'Injected', 'After injection'];
    let context: BrowserContext;

    afterEach(async () => {
      await context?.close();
    });

    it('Chrome MV3 - should log all expected messages', async () => {
      const { project, build } = buildProject(
        contentSource,
        unlistedSource,
        'chrome',
        3,
      );
      await build;

      const extensionPath = project.resolvePath('.output/chrome-mv3/');
      context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
        ],
      });

      const consoleLogs = await collectConsoleLogs(context);
      expect(consoleLogs).toEqual(expectedLogs);
    });

    it('Firefox MV2 - should log all expected messages', async () => {
      const { project, build } = buildProject(
        contentSource,
        unlistedSource,
        'firefox',
        2,
      );
      await build;

      const extensionPath = project.resolvePath('.output/firefox-mv2/');
      context = await launchFirefoxWithExtension(extensionPath);

      const consoleLogs = await collectConsoleLogs(context);
      expect(consoleLogs).toEqual(expectedLogs);
    });

    it('Firefox MV3 - should log all expected messages', async () => {
      const { project, build } = buildProject(
        contentSource,
        unlistedSource,
        'firefox',
        3,
      );
      await build;

      const extensionPath = project.resolvePath('.output/firefox-mv3/');
      context = await launchFirefoxWithExtension(extensionPath);

      const consoleLogs = await collectConsoleLogs(context);
      expect(consoleLogs).toEqual(expectedLogs);
    });
  });
});
