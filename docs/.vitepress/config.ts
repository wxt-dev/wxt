import { defineConfig } from 'vitepress';
import { generateConfigDocs } from './plugins/generate-config-docs';

const title = 'Next-gen Web Extension Framework';
const titleSuffix = ' – WXT';

const description =
  "WXT provides the best developer experience, making it quick, easy, and fun to develop chrome extensions for all browsers. With built-in utilties for building, zipping, and publishing your extension, it's easy to get started.";
const ogTitle = `${title}${titleSuffix}`;
const ogUrl = 'https://wxt.dev';
const ogImage = 'https://wxt.dev/social-preview.png';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  titleTemplate: `:title${titleSuffix}`,
  title: 'WXT',
  description,
  vite: {
    clearScreen: false,
    plugins: [generateConfigDocs()],
  },
  lastUpdated: true,
  sitemap: {
    hostname: 'https://wxt.dev',
  },

  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: ogTitle }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    [
      'script',
      {
        async: '',
        'data-website-id': 'c1840c18-a12c-4a45-a848-55ae85ef7915',
        src: 'https://umami.aklinker1.io/script.js',
      },
    ],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      src: '/logo.svg',
      alt: 'WXT logo',
    },
    editLink: {
      pattern: 'https://github.com/wxt-dev/wxt/edit/main/docs/:path',
    },
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Get Started', link: '/get-started/installation.md' },
      { text: 'Guide', link: '/guide/auto-imports.md' },
      { text: 'Config', link: '/config.md' },
      { text: 'API', link: '/api.md' },
    ],

    sidebar: {
      '/get-started/': [
        {
          text: 'Get Started',
          items: [
            { text: 'Introduction', link: '/get-started/introduction.md' },
            { text: 'Installation', link: '/get-started/installation.md' },
            { text: 'Configuration', link: '/get-started/configuration.md' },
            { text: 'Entrypoints', link: '/get-started/entrypoints.md' },
            { text: 'Assets', link: '/get-started/assets.md' },
            { text: 'Build Targets', link: '/get-started/build-targets.md' },
            { text: 'Publishing', link: '/get-started/publishing.md' },
            { text: 'Testing', link: '/get-started/testing.md' },
            { text: 'Compare', link: '/get-started/compare.md' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Auto-imports', link: '/guide/auto-imports.md' },
            { text: 'Manifest.json', link: '/guide/manifest.md' },
            { text: 'Extension APIs', link: '/guide/extension-apis.md' },
            { text: 'Remote Code', link: '/guide/remote-code.md' },
            { text: 'Vite', link: '/guide/vite.md' },
          ],
        },
        {
          text: 'Entrypoints',
          items: [
            { text: 'Background', link: '/guide/background.md' },
            { text: 'Bookmarks', link: '/guide/bookmarks.md' },
            { text: 'Content Scripts', link: '/guide/content-scripts.md' },
            { text: 'CSS', link: '/guide/css.md' },
            { text: 'Devtools', link: '/guide/devtools.md' },
            { text: 'History', link: '/guide/history.md' },
            { text: 'Newtab', link: '/guide/newtab.md' },
            { text: 'Options', link: '/guide/options.md' },
            { text: 'Popup', link: '/guide/popup.md' },
            { text: 'Sandbox', link: '/guide/sandbox.md' },
            { text: 'Sidepanel', link: '/guide/sidepanel.md' },
            { text: 'Unlisted Pages', link: '/guide/unlisted-pages.md' },
            { text: 'Unlisted Scripts', link: '/guide/unlisted-scripts.md' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/wxt-dev/wxt' }],
  },
});
