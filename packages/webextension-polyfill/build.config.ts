import { defineBuildConfig } from 'unbuild';
import { resolve } from 'node:path';

export default defineBuildConfig({
  rootDir: resolve(__dirname, 'modules/webextension-polyfill'),
  outDir: resolve(__dirname, 'dist'),
  entries: [
    { input: 'index.ts', name: 'index' },
    { input: 'browser.ts', name: 'browser' },
  ],
  replace: {
    'process.env.NPM': 'true',
  },
  declaration: true,
});
