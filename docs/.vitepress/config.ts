import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WXT',
  description: 'Next gen framework for developing web extensions',
  lastUpdated: true,

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
    editLink: {
      pattern: 'https://github.com/aklinker1/wxt/edit/main/docs/:path',
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
            { text: 'Unlisted Pages', link: '/guide/unlisted-pages.md' },
            { text: 'Unlisted Scripts', link: '/guide/unlisted-scripts.md' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/aklinker1/wxt' }],
  },
});
