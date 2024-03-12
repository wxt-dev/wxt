import { defineWorkspace } from 'vitest/config';
import fs from 'fs-extra';
import pc from 'picocolors';
import type { Plugin } from 'vite';
import path from 'node:path';

const seed = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
console.info('Test seed: ' + pc.cyan(seed));

// config.define doesn't work with workspaces, so we have to set it inside a plugin
const testSeed = (): Plugin => ({
  name: 'test-seed',
  config(config) {
    config.define ??= {};
    config.define.__TEST_SEED__ = JSON.stringify(seed);
  },
});

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
      testTimeout: 20e3,
    },
    plugins: [testSeed()],
    resolve,
  },
  {
    test: {
      name: 'e2e',
      dir: 'e2e',
      testTimeout: 120e3,
    },
    plugins: [testSeed()],
    resolve,
  },
]);
