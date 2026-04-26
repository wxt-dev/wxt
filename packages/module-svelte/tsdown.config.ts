import { defineConfig } from 'tsdown';

const entry = {
  index: './src/index.ts',
};

export default defineConfig([
  {
    entry,
  },
  {
    entry,
    format: 'cjs',
  },
]);
