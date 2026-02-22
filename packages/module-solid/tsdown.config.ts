import { defineConfig } from 'tsdown';

const entry = {
  index: './modules/solid.ts',
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
