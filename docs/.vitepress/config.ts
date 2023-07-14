import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WXT',
  description: 'Next gen framework for developing web extensions',
  lastUpdated: true,

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // logo: '/logo.svg',
    editLink: {
      pattern: 'https://github.com/aklinker1/wxt/edit/main/docs/:path',
    },
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Get Started', link: '/get-started/installation.md' },
      { text: 'Guide', link: '/guide.md' },
      { text: 'API', link: '/api.md' },
    ],

    sidebar: {
      '/get-started/': [
        {
          text: 'Guide',
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
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/aklinker1/wxt' }],
  },
});
