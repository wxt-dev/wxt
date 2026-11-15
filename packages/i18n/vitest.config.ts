import RandomSeed from 'vitest-plugin-random-seed';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
  plugins: [RandomSeed()],
});
