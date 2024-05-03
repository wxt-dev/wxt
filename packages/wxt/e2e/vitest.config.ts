import { defineProject } from 'vitest/config';
import { resolve } from '../vitest.config';
import RandomSeed from 'vitest-plugin-random-seed';
import fs from 'fs-extra';

// Clear e2e test projects
await fs.rm('e2e/dist', { recursive: true, force: true });

export default defineProject({
  test: {
    name: 'wxt (e2e)',
    testTimeout: 120e3,
  },
  plugins: [RandomSeed()],
  resolve,
});
