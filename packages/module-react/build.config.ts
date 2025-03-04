import { defineBuildConfig } from 'unbuild';
import { resolve } from 'node:path';

export default defineBuildConfig({
  rootDir: resolve(__dirname, 'modules'),
  outDir: resolve(__dirname, 'dist'),
  entries: [{ input: 'react.ts', name: 'index' }],
  rollup: {
    emitCJS: true,
  },
  declaration: true,
});
