import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    default_locale: 'en',
    web_accessible_resources: [
      {
        resources: ['/iframe-src.html'],
        matches: ['*://*.google.com/*'],
      },
    ],
  },
});
