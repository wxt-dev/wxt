import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineProject } from 'vite-plus/test/config';
import RandomSeed from 'vitest-plugin-random-seed';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
    testTimeout: 120e3,
    setupFiles: ['./vitest.setup.ts'],
    globalSetup: ['./vitest.globalSetup.ts'],
  },
  server: {
    watch: {
      ignored: '**/dist/**',
    },
  },
  plugins: [RandomSeed()],
  resolve: {
    alias: {
      'wxt/testing/fake-browser': path.resolve(
        root,
        'src/testing/fake-browser.ts',
      ),
      'wxt/testing/vitest-plugin': path.resolve(
        root,
        'src/testing/wxt-vitest-plugin.ts',
      ),
    },
  },
});
