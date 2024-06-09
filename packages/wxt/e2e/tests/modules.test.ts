import { describe, it } from 'vitest';
import { TestProject } from '../utils';
import type { GenericEntrypoint, InlineConfig } from '../../src/types';

describe('Module Helpers', () => {
  describe('addEntrypoint', () => {
    it('should add a custom entrypoint to be bundled the project', async () => {
      const project = new TestProject();

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
        `
          export default defineUnlistedScript(() => {
            console.log("injected!");
          })
        `,
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
    });
  });
});
