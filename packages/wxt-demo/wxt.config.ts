import { defineConfig } from 'wxt';
import { presetWind3 } from 'unocss';

export default defineConfig({
  srcDir: 'src',
  targetBrowsers: ['chrome', 'firefox', 'safari'],
  manifest: {
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2wQE8TxGFHpirCxmeszeNQDFybx/ROi7znz6eIvcgK44MQg2MRp/IBJtAyWXRaa+fId8qAerFawu2VpLo/D4NqIM3Jyce49NZHsiuOVeNwDd8+DEoGNUTG3rgSTYGMTA76JzPU7uv9Lqi0V6kSgAUl+j9Y4jvieKPLg9+qvuk+dvV6Oz8aPNgRPNgjWLwcfC/oZKxioIL+JsAa2bsIX4WpBYYop167NGkHv+nsl3j0Vt7rJv5BmqIhKK5rCb11mOmeZ8iNQyqMY+6b4QTTxX5792ypuOhuGu0bHBj96DUcVUfUMHby6gdoA+mIRBftl+82+8D5bfHBxV9qGyWPXcpQIDAQAB',
    permissions: ['storage'],
    default_locale: 'en',
    web_accessible_resources: [
      {
        resources: ['iframe-src.html', 'unlisted.js'],
        matches: ['*://*.google.com/*', '*://*.example.com/*'],
      },
    ],
  },
  zip: {
    downloadPackages: ['sass'],
  },
  analysis: {
    open: true,
  },
  webExt: {
    chromiumPref: {
      'extensions.pinned_extensions': ['ialddiekpanaiffomfkfchejlohnhhce'],
    },
  },
  example: {
    a: 'a',
    // @ts-expect-error: c is not defined, this should be a type error, but it should show up in the module
    c: 'c',
  },
  unocss: {
    excludeEntrypoints: [
      'example',
      'iframe-src',
      'injected',
      'example-tsx',
      'example-2',
      'iframe',
      'location-change',
      'main-world',
      'sandbox',
      'sidepanel',
      'unlisted',
    ],
    configOrPath: {
      content: {
        pipeline: {
          include: [
            // the default
            /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
            // include js/ts files
            'src/entrypoints/**/*.{js,ts}',
          ],
        },
      },
      presets: [presetWind3()],
    },
  },
});
