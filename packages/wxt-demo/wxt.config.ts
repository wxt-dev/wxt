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
  zip: {
    downloadPackages: ['sass'],
  },
  analysis: {
    open: true,
  },
  experimental: {
    viteRuntime: true,
  },
  example: {
    a: 'a',
    // @ts-expect-error: c is not defined, this should error out
    c: 'c',
  },
});
