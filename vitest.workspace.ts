import { defineWorkspace } from 'vitest/config';
import fs from 'fs-extra';
import path from 'node:path';
import RandomSeed from 'vitest-plugin-random-seed';

const resolve = {
  alias: {
    '~': path.resolve('src'),
    'webextension-polyfill': path.resolve('src/virtual/mock-browser'),
    'wxt/testing': path.resolve('src/testing'),
  },
};

// Clear e2e test projects
await fs.rm('e2e/dist', { recursive: true, force: true });

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      dir: 'src',
      mockReset: true,
      restoreMocks: true,
      setupFiles: 'vitest.setup.ts',
    },
    plugins: [RandomSeed()],
    resolve,
  },
  {
    test: {
      name: 'e2e',
      dir: 'e2e',
      testTimeout: 120e3,
    },
    plugins: [RandomSeed()],
    resolve,
  },
]);
