import { defineConfig } from 'vitest/config';
import path from 'node:path';
import RandomSeed from 'vitest-plugin-random-seed';

export default defineConfig({
  test: {
    mockReset: true,
    restoreMocks: true,
    setupFiles: ['vitest.setup.ts'],
    testTimeout: 120e3,
    coverage: {
      include: ['src/**'],
      exclude: ['**/dist', '**/__tests__', 'src/utils/testing'],
    },
  },
  server: {
    watch: {
      ignored: '**/dist/**',
    },
  },
  plugins: [RandomSeed()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      'wxt/testing': path.resolve('src/testing'),
      'webextension-polyfill': path.resolve('src/virtual/mock-browser'),
    },
  },
});
