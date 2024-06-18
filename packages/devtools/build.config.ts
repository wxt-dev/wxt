import { defineBuildConfig } from 'unbuild';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import unocss from 'unocss/vite';
import { resolve } from 'node:path';

// Build module and plugin
export default defineBuildConfig({
  entries: [
    {
      input: 'index.ts',
      format: 'esm',
    },
    {
      input: 'plugin/index.ts',
      format: 'esm',
    },
  ],
  outDir: resolve(__dirname, 'dist'),
  rootDir: 'modules/devtools',
  rollup: {
    emitCJS: true,
  },
  declaration: true,
  hooks: {
    'build:done': prebuildUi,
  },
});

async function prebuildUi() {
  // Prebuild the UI so it doesn't have to be built during the extension
  await build({
    root: 'modules/devtools',
    plugins: [vue(), unocss()],
    build: {
      emptyOutDir: false,
      rollupOptions: {
        input: 'modules/devtools/wxt-devtools.html',
        output: {
          dir: 'dist/prebuilt',
        },
      },
    },
  });
}
