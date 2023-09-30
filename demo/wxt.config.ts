import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    default_locale: 'en',
    web_accessible_resources: [
      // TODO: Add this automatically
      {
        resources: ['content-scripts/*.css'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
