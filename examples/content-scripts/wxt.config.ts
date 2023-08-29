import { defineConfig } from 'wxt';

// See https://wxt.dev/config.html
export default defineConfig({
  manifest: {
    content_scripts: [
      {
        css: ['content-scripts/bing.css'],
        matches: ['*://*.bing.com/*'],
      },
    ],
  },
});
