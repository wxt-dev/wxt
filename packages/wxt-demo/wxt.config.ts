import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    permissions: ['storage'],
    default_locale: 'en',
    web_accessible_resources: [
      {
        resources: ['/iframe-src.html'],
        matches: ['*://*.google.com/*'],
      },
    ],
  },
  imports: {
    eslintrc: {
      enabled: 'auto',
    },
  },
  zip: {
    downloadPackages: ['sass'],
  },
  analysis: {
    open: true,
  },
  runner: {
    startUrls: ['https://duckduckgo.com'],
  },
  example: {
    a: 'a',
    // @ts-expect-error: c is not defined, this should error out
    c: 'c',
  },
});
