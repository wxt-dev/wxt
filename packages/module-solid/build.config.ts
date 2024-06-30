import { defineBuildConfig } from 'unbuild';
import { resolve } from 'node:path';

export default defineBuildConfig({
  rootDir: 'modules',
  outDir: resolve(__dirname, 'dist'),
  entries: [{ input: 'solid.ts', name: 'index' }],
  rollup: {
    emitCJS: true,
  },
  declaration: true,
});
