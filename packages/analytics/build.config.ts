import { defineBuildConfig } from 'unbuild';
import * as vite from 'vite';
import { resolve } from 'node:path';

// Build module and plugins
export default defineBuildConfig({
  rootDir: 'modules/my-module',
  outDir: resolve(__dirname, 'dist'),
  entries: ['index.ts', 'plugin.ts'],
  replace: {
    'process.env.NPM': 'true',
  },
  declaration: true,
  hooks: {
    'build:done': prebuildEntrypoints,
  },
});

// Prebuild entrypoints
async function prebuildEntrypoints() {
  await vite.build({
    root: 'modules/my-module',
    build: {
      emptyOutDir: false,
      rollupOptions: {
        input: 'modules/my-module/example.html',
        output: {
          dir: 'dist/prebuilt',
        },
      },
    },
  });
}
