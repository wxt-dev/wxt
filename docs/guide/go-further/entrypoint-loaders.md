# Entrypoint Loaders

Because entrypoint options, like content script matches, are listed in the entrypoint's JS file, WXT has to import them during the build process to use those options when generating the manifest.

There are two options for loading your entrypoints:

1. `vite-node` - default as of `v0.19.0`
2. `jiti` (**DEPRECATED, will be removed in `v0.20.0`**) - Default before `v0.19.0`

## vite-node

```ts
export default defineConfig({
  entrypointLoader: 'vite-node', // (or don't include the option at all)
});
```

Since 0.19.0, WXT uses `vite-node`, the same tool that powers Vitest and Nuxt, to import your entrypoint files.

There isn't really anything to add here... By default, it should "just work".

## jiti

```ts
export default defineConfig({
  entrypointLoader: 'jiti',
});
```

The original method WXT used to import TS files. However, because it doesn't support vite plugins like `vite-node`, there is one main caveot to it's usage: **_module side-effects_**.

You cannot use imported variables outside the `main` function in JS entrypoints. This includes options, as shown below:

```ts
// entrypoints/content.ts
import { GOOGLE_MATCHES } from '~/utils/match-patterns';

export default defineContentScript({
  matches: GOOGLE_MATCHES,
  main() {
    // ...
  },
});
```

```
$ wxt build
wxt build

WXT 0.14.1
ℹ Building chrome-mv3 for production with Vite 5.0.5
✖ Command failed after 360 ms

[8:55:54 AM]  ERROR  entrypoints/content.ts: Cannot use imported variable "GOOGLE_MATCHES" before main function. See https://wxt.dev/guide/entrypoints.html#side-effects
```

This throws an error because WXT needs to import each entrypoint during the build process to extract its definition (containing the `match`, `runAt`, `include`/`exclude`, etc.) to render the `manifest.json` correctly. Before loading an entrypoint, a transformation is applied to remove all imports. This prevents imported modules (local or NPM) with side-effects from running during the build process, potentially throwing an error.

:::details Why?

When importing your entrypoint to get its definition, the file is imported in a **_node environment_**, and doesn't have access to the `window`, `chrome`, or `browser` globals a web extension usually has access to. If WXT doesn't remove all the imports from the file, the imported modules could try and access one of these variables, throwing an error.

:::

:::warning
See [`wxt-dev/wxt#336`](https://github.com/wxt-dev/wxt/issues/336) to track the status of this bug.
:::

Usually, this error occurs when you try to extract options into a shared file or try to run code outside the `main` function. To fix the example from above, use literal values when defining an entrypoint instead of importing them:

```ts
import { GOOGLE_MATCHES } from '~/utils/match-patterns'; // [!code --]

export default defineContentScript({
  matches: GOOGLE_MATCHES, // [!code --]
  matches: ['*//*.google.com/*'], // [!code ++]
  main() {
    // ...
  },
});
```
