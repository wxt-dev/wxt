import { DefaultTheme, defineConfig } from 'vitepress';
import typedocSidebar from '../api/reference/typedoc-sidebar.json';

const filteredTypedocSidebar = typedocSidebar.filter(
  (item) => item.text !== 'API',
);
// Typedoc's markdown theme adds collapse: true to all our items, event ones without any children,
// so they need to be removed.
function removeCollapsedWithNoItems(items: DefaultTheme.SidebarItem[]) {
  for (const item of items) {
    if (item.items) removeCollapsedWithNoItems(item.items);
    else delete item.collapsed;
  }
}
removeCollapsedWithNoItems(filteredTypedocSidebar);

const title = 'Next-gen Web Extension Framework';
const titleSuffix = ' – WXT';

const description =
  "WXT provides the best developer experience, making it quick, easy, and fun to develop chrome extensions for all browsers. With built-in utilities for building, zipping, and publishing your extension, it's easy to get started.";
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
      { text: 'Get Started', link: '/get-started/introduction' },
      { text: 'Guide', link: '/guide/key-concepts/manifest' },
      { text: 'Examples', link: '/examples' },
      { text: 'API', link: '/api/reference/wxt' },
    ],

    sidebar: {
      '/get-started/': [
        {
          text: 'Get Started',
          base: '/get-started/',
          items: [
            { text: 'Introduction', link: 'introduction' },
            { text: 'Installation', link: 'installation' },
            { text: 'Configuration', link: 'configuration' },
            { text: 'Entrypoints', link: 'entrypoints' },
            { text: 'Web Extension Polyfill', link: 'web-extension-polyfill' },
            { text: 'Assets', link: 'assets' },
            { text: 'Testing', link: 'testing' },
            { text: 'Publishing', link: 'publishing' },
            { text: 'Migrate to WXT', link: 'migrate-to-wxt' },
            { text: 'Compare', link: 'compare' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/introduction.md' },
            { text: 'Installation', link: '/guide/installation.md' },
            { text: 'Configuration', link: '/guide/configuration.md' },
            { text: 'Entrypoints', link: '/guide/entrypoints.md' },
            { text: 'Manifest.json', link: '/guide/manifest.md' },
            { text: 'Extension APIs', link: '/guide/extension-apis.md' },
            { text: 'Storage', link: '/guide/storage.md' },
            { text: 'Assets', link: '/guide/assets.md' },
            { text: 'Content Script UI', link: '/guide/content-script-ui.md' },
            { text: 'Multiple Browsers', link: '/guide/multiple-browsers.md' },
            { text: 'ES Modules', link: '/guide/esm.md' },
            { text: 'Auto-imports', link: '/guide/auto-imports.md' },
            { text: 'Vite', link: '/guide/vite.md' },
            { text: 'Remote Code', link: '/guide/remote-code.md' },
            { text: 'Publishing', link: '/guide/publishing.md' },
            { text: 'Handling Updates', link: '/guide/handling-updates.md' },
            { text: 'Development', link: '/guide/development.md' },
            { text: 'Testing', link: '/guide/testing.md' },
          ],
        },
        {
          text: 'Other',
          items: [
            { text: 'Migrate to WXT', link: '/guide/migrate-to-wxt.md' },
            { text: 'Compare', link: '/guide/compare.md' },
          ],
        },
      ],
      '/entrypoints/': [
        {
          text: 'Entrypoints',
          items: [
            { text: 'Background', link: '/entrypoints/background.md' },
            { text: 'Bookmarks', link: '/entrypoints/bookmarks.md' },
            {
              text: 'Content Scripts',
              link: '/entrypoints/content-scripts.md',
            },
            { text: 'CSS', link: '/entrypoints/css.md' },
            { text: 'Devtools', link: '/entrypoints/devtools.md' },
            { text: 'History', link: '/entrypoints/history.md' },
            { text: 'Newtab', link: '/entrypoints/newtab.md' },
            { text: 'Options', link: '/entrypoints/options.md' },
            { text: 'Popup', link: '/entrypoints/popup.md' },
            { text: 'Sandbox', link: '/entrypoints/sandbox.md' },
            { text: 'Side Panel', link: '/entrypoints/sidepanel.md' },
            { text: 'Unlisted Pages', link: '/entrypoints/unlisted-pages.md' },
            {
              text: 'Unlisted Scripts',
              link: '/entrypoints/unlisted-scripts.md',
            },
          ].sort((l, r) => l.text.localeCompare(r.text)),
        },
      ],
      '/api/': [
        {
          items: [
            {
              text: 'Commands',
              collapsed: true,
              base: '/api/commands/',
              items: [
                { text: 'wxt', link: 'wxt.md' },
                { text: 'wxt build', link: 'wxt-build.md' },
                { text: 'wxt zip', link: 'wxt-zip.md' },
                { text: 'wxt prepare', link: 'wxt-prepare.md' },
                { text: 'wxt clean', link: 'wxt-clean.md' },
                { text: 'wxt init', link: 'wxt-init.md' },
                { text: 'wxt submit', link: 'wxt-submit.md' },
                { text: 'wxt submit init', link: 'wxt-submit-init.md' },
              ],
            },
            {
              text: 'API Reference',
              collapsed: true,
              items: filteredTypedocSidebar,
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'discord', link: 'https://discord.gg/ZFsZqGery9' },
      { icon: 'github', link: 'https://github.com/wxt-dev/wxt' },
    ],
  },
});
