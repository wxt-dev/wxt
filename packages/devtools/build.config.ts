import { defineBuildConfig } from 'unbuild';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';

// Build module and plugin
export default defineBuildConfig({
  entries: [
    {
      input: 'modules/devtools/index.ts',
      srcDir: 'modules/devtools',
      distDir: 'dist',
      format: 'esm',
    },
    {
      input: 'modules/devtools/plugin/index.ts',
      format: 'esm',
    },
  ],
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
    plugins: [vue()],
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
