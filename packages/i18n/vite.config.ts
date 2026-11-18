import { defineConfig } from 'vite-plus';
import RandomSeed from 'vitest-plugin-random-seed';

const entry = ['src/index.ts', 'src/build.ts', 'src/module.ts'];

export default defineConfig({
  pack: [
    {
      entry,
    },
    {
      entry,
      format: 'cjs',
    },
  ],
  test: {
    isolate: false,
    mockReset: true,
    restoreMocks: true,
  },
  plugins: [RandomSeed()],
});
