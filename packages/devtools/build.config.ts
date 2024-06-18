import { defineBuildConfig } from 'unbuild';
import { build } from 'vite';

async function prebuildUi() {
  // Prebuild the UI so it doesn't have to be built during the extension
  const { build } = await import('vite');
  await build({
    root: 'src',
    build: {
      emptyOutDir: false,
      rollupOptions: {
        input: 'src/_devtools.html',
        output: {
          dir: 'dist/prebuilt',
        },
      },
    },
  });
}

// Build module and plugin
export default defineBuildConfig({
  entries: [
    {
      input: 'modules/devtools/index.ts',
      srcDir: 'modules/devtools',
      format: 'esm',
    },
    {
      input: 'modules/devtools/plugin.ts',
      srcDir: 'modules/devtools',
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
