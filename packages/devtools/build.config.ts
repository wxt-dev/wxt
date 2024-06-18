import { defineBuildConfig } from 'unbuild';

// Build module and plugin
export default defineBuildConfig({
  entries: ['src/index.ts', 'src/plugin.ts'],
  rollup: {
    emitCJS: true,
  },
  declaration: true,
  hooks: {
    'build:done': async () => {
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
    },
  },
});
