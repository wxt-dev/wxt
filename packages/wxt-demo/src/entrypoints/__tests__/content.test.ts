import { describe, expect, it } from 'vitest';
import {
  contentSource,
  expectOutputContainsLogs,
  unlistedSource,
} from '@/utils/test-helpers.ts';

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

  describe('Build Output Verification', () => {
    const expectedConsoleLogs = ['Injecting...', 'After injection', 'Injected'];

    it('Chrome MV3 - output files should contain all expected console.log calls', async () => {
      await expectOutputContainsLogs('chrome', 3, expectedConsoleLogs);
    });

    it('Firefox MV2 - output files should contain all expected console.log calls', async () => {
      await expectOutputContainsLogs('firefox', 2, expectedConsoleLogs);
    });

    it('Firefox MV3 - output files should contain all expected console.log calls', async () => {
      await expectOutputContainsLogs('firefox', 3, expectedConsoleLogs);
    });
  });
});
