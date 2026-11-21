import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    isolate: false,
    mockReset: true,
    restoreMocks: true,
    setupFiles: ['vitest.setup.ts'],
  },
});
