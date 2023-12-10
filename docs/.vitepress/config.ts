import { DefaultTheme, defineConfig } from 'vitepress';
import { generateCliDocs } from './plugins/generate-cli-docs';
import typedocSidebar from '../api/typedoc-sidebar.json';

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
    plugins: [generateCliDocs()],
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
      { text: 'Guide', link: '/guide/installation.md' },
      { text: 'Entrypoints', link: '/entrypoints/background.md' },
      { text: 'Examples', link: '/examples.md' },
      { text: 'API', link: '/api/cli.md' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/introduction.md' },
            { text: 'Installation', link: '/guide/installation.md' },
            { text: 'Configuration', link: '/guide/configuration.md' },
            { text: 'Entrypoints', link: '/guide/entrypoints.md' },
            { text: 'Assets', link: '/guide/assets.md' },
            { text: 'Multiple Browsers', link: '/guide/multiple-browsers.md' },
            { text: 'Publishing', link: '/guide/publishing.md' },
            { text: 'Auto-imports', link: '/guide/auto-imports.md' },
            { text: 'Manifest.json', link: '/guide/manifest.md' },
            { text: 'Extension APIs', link: '/guide/extension-apis.md' },
            { text: 'Storage', link: '/guide/storage.md' },
            { text: 'Content Script UI', link: '/guide/content-script-ui.md' },
            { text: 'Remote Code', link: '/guide/remote-code.md' },
            { text: 'Development', link: '/guide/development.md' },
            { text: 'Testing', link: '/guide/testing.md' },
            { text: 'Vite', link: '/guide/vite.md' },
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
            { text: 'Sidepanel', link: '/entrypoints/sidepanel.md' },
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
            { text: 'CLI', link: '/api/cli.md' },
            {
              text: 'Modules',
              items: filteredTypedocSidebar,
            },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/wxt-dev/wxt' }],
  },
});
