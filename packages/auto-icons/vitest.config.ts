import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
});
