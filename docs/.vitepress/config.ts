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
          items: [
            {
              text: 'Key Concepts',
              collapsed: true,
              base: '/guide/key-concepts/',
              items: [
                { text: 'Manifest', link: 'manifest' },
                { text: 'Auto-imports', link: 'auto-imports' },
                {
                  text: 'Web Extension Polyfill',
                  link: 'web-extension-polyfill',
                },
                { text: 'Frontend Frameworks', link: 'frontend-frameworks' },
                { text: 'Content Script UI', link: 'content-script-ui' },
              ],
            },
            {
              text: 'Directory Structure',
              collapsed: true,
              base: '/guide/directory-structure/',
              items: [
                // Folders
                { text: '.output/', link: 'output' },
                { text: '.wxt/', link: 'wxt' },
                { text: 'assets/', link: 'assets' },
                { text: 'components/', link: 'components' },
                { text: 'composables/', link: 'composables' },
                {
                  text: 'entrypoints/',
                  base: '/guide/directory-structure/entrypoints/',
                  collapsed: true,
                  items: [
                    { text: 'background', link: 'background.md' },
                    { text: 'bookmarks', link: 'bookmarks.md' },
                    { text: '*.content.ts', link: 'content-scripts.md' },
                    { text: '*.css', link: 'css.md' },
                    { text: 'devtools', link: 'devtools.md' },
                    { text: 'history', link: 'history.md' },
                    { text: 'newtab', link: 'newtab.md' },
                    { text: 'options', link: 'options.md' },
                    { text: 'popup', link: 'popup.md' },
                    { text: 'sandbox', link: 'sandbox.md' },
                    { text: 'sidepanel', link: 'sidepanel.md' },
                    { text: '*.html', link: 'unlisted-pages.md' },
                    {
                      text: '*.ts',
                      link: 'unlisted-scripts.md',
                    },
                  ],
                },
                { text: 'hooks/', link: 'hooks' },
                { text: 'modules/', link: 'modules' },
                {
                  text: 'public/',
                  link: 'public',
                  items: [{ text: '_locales/', link: 'public/locales' }],
                },
                { text: 'utils/', link: 'modules' },
                // Files
                { text: '.env', link: 'env' },
                { text: 'package.json', link: 'package' },
                { text: 'tsconfig.json', link: 'tsconfig' },
                { text: 'web-ext.config.ts', link: 'web-ext-config' },
                { text: 'wxt.config.ts', link: 'wxt-config' },
              ],
            },
            {
              text: 'Extension APIs',
              collapsed: true,
              base: '/guide/extension-apis/',
              items: [
                { text: 'Storage', link: 'storage' },
                { text: 'Messaging', link: 'messaging' },
                { text: 'Scripting', link: 'scripting' },
                { text: 'Others', link: 'others' },
              ],
            },
            {
              text: 'Go Further',
              collapsed: true,
              base: '/guide/go-further/',
              items: [
                { text: 'Testing', link: 'testing' },
                { text: 'ES Modules', link: 'es-modules' },
                { text: 'Debugging', link: 'debugging' },
                { text: 'Handling Updates', link: 'handling-updates' },
                { text: 'Vite', link: 'vite' },
                { text: 'Custom Events', link: 'custom-events' },
                { text: 'Remote Code', link: 'remote-code' },
                {
                  text: 'Entrypoint Side Effects',
                  link: 'entrypoint-side-effects',
                },
                { text: 'How WXT Works', link: 'how-wxt-works' },
              ],
            },
          ],
        },
      ],
      '/api/': [
        {
          items: [
            {
              text: 'CLI',
              collapsed: true,
              base: '/api/cli/',
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
