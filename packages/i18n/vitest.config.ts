import RandomSeed from 'vitest-plugin-random-seed';
import { defineProject } from 'vite-plus/test/config';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
  plugins: [RandomSeed()],
});
