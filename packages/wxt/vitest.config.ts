import path from 'node:path';

import { defineConfig } from 'vite-plus';
import RandomSeed from 'vitest-plugin-random-seed';

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
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
      'wxt/testing/fake-browser': path.resolve('src/testing/fake-browser.ts'),
      'wxt/testing/vitest-plugin': path.resolve(
        'src/testing/wxt-vitest-plugin.ts',
      ),
    },
  },
});
