---
outline: deep
---

# wxt.config.ts

> See the [API Reference](/api/reference/wxt/interfaces/InlineConfig) for all options. This page only discusses the setup and a few features.

The `wxt.config.ts` file contains the main build configuration for your project. Here's what it looks like:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  // Config goes here
});
```

## Directories

You can configure the following directories:

<!-- prettier-ignore -->
```ts
export default defineConfig({
  // Relative to project root
  srcDir: "src",             // default: "."
  outDir: "dist",            // default: ".output"

  // Relative to srcDir
  entrypointsDir: "entries", // default: "entrtypoints"
  modulesDir: "wxt-modules", // default: "modules"
  publicDir: "static",       // default: "public"
})
```

You can use absolute or relative paths.

## Auto-imports

WXT uses [`unimport`](https://www.npmjs.com/package/unimport), the same tool as Nuxt, to setup auto-imports.

```ts
export default defineConfig({
  // See https://www.npmjs.com/package/unimport#configurations
  imports: {
    // ...
  },
});
```

By default, WXT automatically setups up auto-imports for all of it's own APIs:

- [`browser`](/api/reference/wxt/browser/variables/browser) from `wxt/browser`, a small wrapper around `webextension-polyfill`
- [`defineContentScript`](/api/reference/wxt/sandbox/functions/defineContentScript) from `wxt/sandbox`
- [`defineBackground`](/api/reference/wxt/sandbox/functions/defineBackground) from `wxt/sandbox`
- [`defineUnlistedScript`](/api/reference/wxt/sandbox/functions/defineUnlistedScript) from `wxt/sandbox`
- [`createIntegratedUi`](/api/reference/wxt/client/functions/createIntegratedUi) from `wxt/client`
- [`createShadowRootUi`](/api/reference/wxt/client/functions/createShadowRootUi) from `wxt/client`
- [`createIframeUi`](/api/reference/wxt/client/functions/createIframeUi) from `wxt/client`
- [`fakeBrowser`](/api/reference/wxt/testing/variables/fakeBrowser) from `wxt/testing`
- And more!

WXT also adds some project directories as auto-import sources automatically:

- `<srcDir>/components/*`
- `<srcDir>/composables/*`
- `<srcDir>/hooks/*`
- `<srcDir>/utils/*`

All named and default exports from files in these directories are available anywhere else in your project without having to import them.

### TypeScript

For TypeScript and your editor to recognize auto-imported variables, you need to run the [`wxt prepare` command](/api/cli/wxt-prepare).

Add this command to your `postinstall` script so your editor has everything it needs to report type errors after installing dependencies:

```jsonc
// package.json
{
  "scripts": {
    "postinstall": "wxt prepare", // [!code ++]
  },
}
```

### ESLint

ESLint doesn't know about the auto-imported variables unless they are explicitly defined in the ESLint's `globals`. By default, WXT will generate the config if it detects ESLint is installed in your project. If the config isn't generated automatically, you can manually tell WXT to generate it.

:::code-group

```ts [ESLint 9]
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },
});
```

```ts [ESLint 8]
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 8,
    },
  },
});
```

:::

Then in your ESLint config, import and use the generated file:

:::code-group

```js [ESLint 9]
// eslint.config.mjs
import autoImports from './.wxt/eslint-auto-imports.mjs';

export default [
  autoImports,
  {
    // The rest of your config...
  },
];
```

```js [ESLint 8]
// .eslintrc.mjs
export default {
  extends: ['./.wxt/eslintrc-auto-import.json'],
  // The rest of your config...
};
```

:::

### Disabling Auto-imports

Not all developers like auto-imports. To disable them, set `imports` to `false`.

```ts
export default defineConfig({
  imports: false, // [!code ++]
});
```

## Hooks

WXT includes an in-depth system that let's you hook into the build process and make changes.

Here's an example hook that modifies the `manifest.json` file before it is written to the output directory:

```ts
export default defineConfig({
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.mode === 'development') {
        manifest.title += ' (DEV)';
      }
    },
  },
});
```

> Most hooks provide the `wxt` object as the first argument. If contains the resolved config and other info about the current build.

Putting one-off hooks like this in your config file is simple, but if you find yourself writing lots of hooks, you should extract them into [WXT Modules](/guide/wxt-modules/writing-modules) instead.
