import { defineConfig } from 'vite-plus';

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
});
