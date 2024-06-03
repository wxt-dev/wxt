## Entrypoint Side Effects

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
