import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
});
