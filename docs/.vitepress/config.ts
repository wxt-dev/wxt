import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/reference/typedoc-sidebar.json';
import {
  menuGroup,
  menuItem,
  menuRoot,
  navItem,
  prepareTypedocSidebar,
} from './utils/menus';
import { meta, script } from './utils/head';

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
    meta('og:type', 'website'),
    meta('og:title', ogTitle),
    meta('og:image', ogImage),
    meta('og:url', ogUrl),
    meta('og:description', description),
    meta('twitter:card', 'summary_large_image', { useName: true }),
    script('https://umami.aklinker1.io/script.js', {
      'data-website-id': 'c1840c18-a12c-4a45-a848-55ae85ef7915',
      async: '',
    }),
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

    socialLinks: [
      { icon: 'discord', link: 'https://discord.gg/ZFsZqGery9' },
      { icon: 'github', link: 'https://github.com/wxt-dev/wxt' },
    ],

    nav: [
      navItem('Get Started', '/get-started/introduction'),
      navItem('Guide', '/guide/key-concepts/manifest'),
      navItem('API', '/api/reference/wxt'),
      navItem('Examples', '/examples'),
    ],

    sidebar: {
      '/get-started/': menuRoot([
        menuGroup('Get Started', '/get-started/', [
          menuItem('Introduction', 'introduction'),
          menuItem('Installation', 'installation'),
          menuItem('Configuration', 'configuration'),
          menuItem('Entrypoints', 'entrypoints'),
          menuItem('Assets', 'assets'),
          menuItem('Testing', 'testing'),
          menuItem('Publishing', 'publishing'),
          menuItem('Migrate to WXT', 'migrate-to-wxt'),
          menuItem('Compare', 'compare'),
        ]),
      ]),
      '/guide/': menuRoot([
        menuGroup('Key Concepts', '/guide/key-concepts/', [
          menuItem('Manifest', 'manifest'),
          menuItem('Auto-imports', 'auto-imports'),
          menuItem('Web Extension Polyfill', 'web-extension-polyfill'),
          menuItem('Frontend Frameworks', 'frontend-frameworks'),
          menuItem('Content Script UI', 'content-script-ui'),
        ]),
        menuGroup('Directory Structure', '/guide/directory-structure/', [
          // Folders
          menuItem('.output/', 'output'),
          menuItem('.wxt/', 'wxt'),
          menuItem('assets/', 'assets'),
          menuItem('components/', 'components'),
          menuItem('composables/', 'composables'),
          menuGroup('entrypoints/', '/guide/directory-structure/entrypoints/', [
            menuItem('background', 'background.md'),
            menuItem('bookmarks', 'bookmarks.md'),
            menuItem('*.content.ts', 'content-scripts.md'),
            menuItem('*.css', 'css.md'),
            menuItem('devtools', 'devtools.md'),
            menuItem('history', 'history.md'),
            menuItem('newtab', 'newtab.md'),
            menuItem('options', 'options.md'),
            menuItem('popup', 'popup.md'),
            menuItem('sandbox', 'sandbox.md'),
            menuItem('sidepanel', 'sidepanel.md'),
            menuItem('*.html', 'unlisted-pages.md'),
            menuItem('*.ts', 'unlisted-scripts.md'),
          ]),
          menuItem('hooks/', 'hooks'),
          menuItem('public/', 'public/', [
            menuItem('_locales/', 'public/locales'),
          ]),
          menuItem('utils/', 'utils'),

          // Files
          menuItem('.env', 'env'),
          menuItem('package.json', 'package'),
          menuItem('tsconfig.json', 'tsconfig'),
          menuItem('web-ext.config.ts', 'web-ext-config'),
          menuItem('wxt.config.ts', 'wxt-config'),
        ]),
        menuGroup('Extension APIs', '/guide/extension-apis/', [
          menuItem('Storage', 'storage'),
          menuItem('Messaging', 'messaging'),
          menuItem('Scripting', 'scripting'),
          menuItem('Others', 'others'),
        ]),
        menuGroup('Go Further', '/guide/go-further/', [
          menuItem('Testing', 'testing'),
          menuItem('ES Modules', 'es-modules'),
          menuItem('Debugging', 'debugging'),
          menuItem('Handling Updates', 'handling-updates'),
          menuItem('Vite', 'vite'),
          menuItem('Custom Events', 'custom-events'),
          menuItem('Remote Code', 'remote-code'),
          menuItem('Entrypoint Side Effects', 'entrypoint-side-effects'),
          menuItem('How WXT Works', 'how-wxt-works'),
        ]),
      ]),
      '/api/': menuRoot([
        menuGroup('CLI', '/api/cli/', [
          menuItem('wxt', 'wxt.md'),
          menuItem('wxt build', 'wxt-build.md'),
          menuItem('wxt zip', 'wxt-zip.md'),
          menuItem('wxt prepare', 'wxt-prepare.md'),
          menuItem('wxt clean', 'wxt-clean.md'),
          menuItem('wxt init', 'wxt-init.md'),
          menuItem('wxt submit', 'wxt-submit.md'),
          menuItem('wxt submit init', 'wxt-submit-init.md'),
        ]),
        menuGroup('API Reference', prepareTypedocSidebar(typedocSidebar)),
      ]),
    },
  },
});
