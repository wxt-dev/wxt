import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    entry: {
      index: 'modules/webextension-polyfill/index.ts',
      browser: 'modules/webextension-polyfill/browser.ts',
    },
    define: {
      'process.env.NPM': 'true',
    },
  },
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
