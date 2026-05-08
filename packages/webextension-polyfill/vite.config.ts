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
        dependsOn: ['wxt#build'],
        input: [{ auto: true }, '!.wxt/**'],
        command: 'vpx wxt prepare',
      },
    },
  },
});
