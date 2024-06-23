# Auto-imports

WXT uses the same tool as Nuxt for auto-imports, [`unimport`](https://github.com/unjs/unimport).

## WXT Auto-imports

Some WXT APIs can be used without importing them:

- [`browser`](/api/reference/wxt/browser/variables/browser) from `wxt/browser`, a small wrapper around `webextension-polyfill`
- [`defineContentScript`](/api/reference/wxt/sandbox/functions/defineContentScript) from `wxt/sandbox`
- [`defineBackground`](/api/reference/wxt/sandbox/functions/defineBackground) from `wxt/sandbox`
- [`defineUnlistedScript`](/api/reference/wxt/sandbox/functions/defineUnlistedScript) from `wxt/sandbox`
- [`createIntegratedUi`](/api/reference/wxt/client/functions/createIntegratedUi) from `wxt/client`
- [`createShadowRootUi`](/api/reference/wxt/client/functions/createShadowRootUi) from `wxt/client`
- [`createIframeUi`](/api/reference/wxt/client/functions/createIframeUi) from `wxt/client`
- [`fakeBrowser`](/api/reference/wxt/testing/variables/fakeBrowser) from `wxt/testing`

And more!

## Project Auto-imports

In addition WXT APIs, default and named exports from inside the following directories can be used without listing them in imports.

- `<srcDir>/components/*`
- `<srcDir>/composables/*`
- `<srcDir>/hooks/*`
- `<srcDir>/utils/*`

To add auto-imports from subdirectories, like `utils/api/some-file.ts`, re-export them from the base directory:

```ts
// utils/index.ts
export * from './api/some-file.ts';
```

Alternatively, you could add the directory to the list of auto-import directories in your config file.

## TypeScript

For TypeScript to work, you need to run the `wxt prepare` command. This will ensure types are generated for auto-imports.

This should be added to your `postinstall` script so your editor has everything it needs to report type errors after installing dependencies:

```json
// package.json
{
  "scripts": {
    "postinstall": "wxt prepare" // [!code ++]
  }
}
```

## Customization

You can override the default auto-import behavior in your `wxt.config.ts` file.

See [`unimport`'s documentation](https://github.com/unjs/unimport#configurations) for a complete list of options.

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  imports: {
    // Add auto-imports for vue functions like createApp, ref, computed, watch, toRaw, etc...
    presets: ['vue'],
  },
});
```

## Disabling Auto-imports

To disable auto-imports, set `imports: false`

```ts
export default defineConfig({
  imports: false,
});
```

## ESLint

ESLint doesn't understand auto-imports; it thinks all auto-imported variables are undeclared globals and will report lint errors for each. To fix this, extend the ESLint file generated inside the `.wxt` directory:

```js
// .eslintrc.js
module.exports = {
  extends: ['./.wxt/eslintrc-auto-import.json'],
};
```

By default, this file will be generated when ESLint is a direct dependency. If ESLint is a subdependency or your project is a monorepo, it may not be generated automatically. In this case, you can tell WXT to generate it:

```ts
// wxt.config.ts
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: true,
    },
  },
});
```
