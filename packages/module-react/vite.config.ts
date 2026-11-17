import { defineConfig } from 'vite-plus';

const entry = {
  index: './modules/react.ts',
};

export default defineConfig({
  pack: [
    {
      deps: {
        // tsdown <0.23 compatibility: resolve external dependency subpaths.
        // Remove to preserve subpath imports as written (the new default).
        // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
        resolveDepSubpath: true,
      },
      entry,
    },
    {
      deps: {
        // tsdown <0.23 compatibility: resolve external dependency subpaths.
        // Remove to preserve subpath imports as written (the new default).
        // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
        resolveDepSubpath: true,
      },
      entry,
      format: 'cjs',
    },
  ],
  run: {
    tasks: {
      postinstall: {
        dependsOn: ['wxt#build', '@wxt-dev/storage#build'],
        cache: {
          input: [{ auto: true }, '!.wxt/**'],
        },
        command: 'vp exec wxt prepare',
      },
    },
  },
});
