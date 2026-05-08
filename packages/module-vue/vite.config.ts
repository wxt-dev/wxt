import { defineConfig } from 'vite-plus';

const entry = {
  index: './src/index.ts',
};

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
