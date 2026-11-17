import { defineProject } from 'vite-plus/test/config';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
    setupFiles: ['vitest.setup.ts'],
  },
});
