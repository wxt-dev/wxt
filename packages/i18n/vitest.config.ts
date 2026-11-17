import { defineProject } from 'vite-plus/test/config';
import RandomSeed from 'vitest-plugin-random-seed';

export default defineProject({
  test: {
    clearMocks: false,
    mockReset: true,
    restoreMocks: true,
  },
  plugins: [RandomSeed()],
});
