import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
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
        input: [{ auto: true }, '!.wxt/**'],
        command: 'vp exec wxt prepare',
      },
    },
  },
});
