import { defineProject } from 'vite-plus/test/config';
import RandomSeed from 'vitest-plugin-random-seed';

export default defineProject({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    mockReset: true,
    restoreMocks: true,
  },
  plugins: [RandomSeed()],
});
