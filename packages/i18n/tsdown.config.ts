import { defineConfig } from 'tsdown';

const entry = ['src/index.ts', 'src/build.ts', 'src/module.ts'];

export default defineConfig([
  {
    entry,
  },
  {
    entry,
    format: 'cjs',
  },
]);
