import { defineConfig } from 'tsdown';

const entry = {
  index: './modules/react.ts',
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
