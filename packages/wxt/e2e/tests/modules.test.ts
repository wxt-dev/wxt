import { describe, it, expect, vi } from 'vitest';
import { TestProject } from '../utils';
import type { GenericEntrypoint, InlineConfig } from '../../src/types';

describe('Module Helpers', () => {
  describe('options', () => {
    it('should recieve the options defined in wxt.config.ts based on the configKey field', async () => {
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
            setup: async (options, wxt) => {
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

      const entrypoint: GenericEntrypoint = {
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

          export default defineWxtModule((_, wxt) => {
            addEntrypoint(wxt, ${JSON.stringify(entrypoint)})
          })
        `,
      );
      const config: InlineConfig = {
        browser: 'chrome',
      };

      await project.build(config);

      expect(await project.fileExists('.output/chrome-mv3/injected.js')).toBe(
        true,
      );
    });
  });
});
