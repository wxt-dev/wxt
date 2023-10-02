# Auto-imports

WXT uses the same tool as Nuxt for auto-imports, [`unimport`](https://github.com/unjs/unimport).

:::info Testing
To setup your test environment for auto-imports, see [Testing](/guide/testing).
:::

## WXT Auto-imports

Some WXT APIs can be used without importing them:

- [`browser`](/api/wxt-browser#browser) from `wxt/browser`, a small wrapper around `webextension-polyfill`
- [`defineContentScript`](/api/wxt-client#defiencontentscript) from `wxt/client`
- [`defineBackground`](/api/wxt-client#definebackgroundscript) from `wxt/client`
- [`createContentScriptUi`](/api/wxt-client#createcontentscriptui) from `wxt/client`

And more. All [`wxt/client`](/api/wxt-client) APIs can be used without imports.

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

This should be added to your `postinstall` script:

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
    // Add auto-imports for vue fuctions like createApp, ref, computed, watch, toRaw, etc...
    preset: ['vue'],
  },
});
```

To disable auto-imports, set `imports: false`

```ts
export default defineConfig({
  imports: false,
});
```
