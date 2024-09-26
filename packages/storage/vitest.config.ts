import { defineConfig } from 'vitest/config';
import path from 'node:path';
import RandomSeed from 'vitest-plugin-random-seed';

export default defineConfig({
  test: {
    mockReset: true,
    restoreMocks: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
