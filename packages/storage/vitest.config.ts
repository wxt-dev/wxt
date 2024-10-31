import { defineProject } from 'vitest/config';
import RandomSeed from 'vitest-plugin-random-seed';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
  plugins: [RandomSeed()],
});
