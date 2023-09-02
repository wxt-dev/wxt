import { defineWorkspace } from 'vitest/config';
import fs from 'fs-extra';
import pc from 'picocolors';
import { Plugin } from 'vite';

const seed = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
console.info('Test seed: ' + pc.cyan(seed));

// config.define doesn't work with workspaces, so we have to set it inisde a plugin
const testSeed = (): Plugin => ({
  name: 'test-seed',
  config(config) {
    config.define ??= {};
    config.define.__TEST_SEED__ = JSON.stringify(seed);
  },
});

// Clear e2e test projects
await fs.rm('e2e/project', { recursive: true, force: true });

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      dir: 'src',
      mockReset: true,
      restoreMocks: true,
    },
    plugins: [testSeed()],
  },
  {
    test: {
      name: 'e2e',
      dir: 'e2e',
      singleThread: true,
      testTimeout: 60e3,
    },
    plugins: [testSeed()],
  },
]);
