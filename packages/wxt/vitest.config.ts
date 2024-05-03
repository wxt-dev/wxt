import { defineProject } from 'vitest/config';
import path from 'node:path';
import RandomSeed from 'vitest-plugin-random-seed';

export const resolve = {
  alias: {
    '~': path.resolve('src'),
    'wxt/testing': path.resolve('src/testing'),
    'webextension-polyfill': path.resolve('src/virtual/mock-browser'),
  },
};

export default defineProject({
  test: {
    name: 'wxt (unit)',
    dir: 'src',
    mockReset: true,
    restoreMocks: true,
    setupFiles: ['vitest.setup.ts'],
  },
  plugins: [RandomSeed()],
  resolve,
});
