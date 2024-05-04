import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

describe.each([true, false])(
  'Manifest Content (Vite runtime? %s)',
  (viteRuntime) => {
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
        await project.build({ browser, experimental: { viteRuntime } });

        const safariManifest = await project.getOutputManifest(
          `.output/${outDir}/manifest.json`,
        );
        expect(safariManifest.background.persistent).toBe(expected);
      },
    );
  },
);
