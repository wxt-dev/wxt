import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'modules/webextension-polyfill/index.ts',
    browser: 'modules/webextension-polyfill/browser.ts',
  },
  define: {
    'process.env.NPM': 'true',
  },
});
