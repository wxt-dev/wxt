# Defining Entrypoints

An "entrypoint" is any HTML, JS, or CSS file that needs to be bundled and included with the extension.

Entrypoints may or may not be listed in the extension's `manifest.json`.

## `/entrypoints` Directory

In WXT, entrypoints are defined by adding a file to the `entrypoints/` directory.

For example, a project that looks like this:

```
<rootDir>
└─ entrypoints/
   ├─ background.ts
   ├─ content.ts
   ├─ injected.ts
   └─ popup.html
```

would result in the following `manifest.json`:

```json
{
  // ...
  "manifest_version": 3,
  "action": {
    // ...
    "default_popup": "popup.html"
  },
  "background": {
    // ...
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      // ...
      "js": ["content-scripts/content.js"]
    }
  ]
}
```

If a file uses a special name recognized by WXT, it will be added to the manifest. In this case:

- `popup.html` &rarr; `action.default_popup`
- `content.ts` &rarr; `content_scripts.0.js.0`
- `background.ts` &rarr; `background.service_worker`

But not all entrypoints are added to the `manifest.json`. If the filename is not recognized by WXT, they are still built and included in the extension, but they are considered "unlisted" and are not apart of the manifest.

In this case, `injected.ts` gets output to `<outdir>/injected.js` and is accessible via `browser.runtime.getURL("/injected.js")`.

:::info
See [`/entrypoints` folder](/entrypoints/background) documentation for a full list of recognized entrypoint filenames.
:::

## Entrypoint Options

Some entrypoints, like content scripts, actions, or the background, can receive additional options.

In HTML files, options are listed as `meta` tags:

```html
<html>
  <head>
    <!-- Defining the popup's "default_icon" field -->
    <meta name="manifest.default_icon" content="{ '16': '/icon/16.png' }" />
  </head>
</html>
```

In TS files, options are apart of the file's default export:

```ts
export default defineContentScript({
  matches: ['*://*.google.com/*'],
  runAt: 'document_start',
  main() {
    // ...
  },
});
```

:::info
For a full list of entrypoints and each of their options, see the [`/entrypoints` folder](/entrypoints/background) documentation.
:::

### Side Effects

You cannot use imported variables outside the `main` function is JS entrypoints. This includes options, as shown below:

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

This throws an error because WXT needs to import each entrypoint during the build process to extract its definition (containing the `match`, `run_at`, `include`/`exclude`, etc.) to render the `manifest.json` correctly. Before loading an entrypoint, a transformation is applied to remove all imports. This prevents imported modules (local or NPM) with side-effects from running during the build process, potentially throwing an error.

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
