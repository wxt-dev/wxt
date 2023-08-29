# Extension APIs

WXT is built on top of [`webextension-polyfill`](https://www.npmjs.com/package/webextension-polyfill), which uses the standard `browser` global.

If you're used to Chrome's `chrome` global, its a simple switch:

1. Replace `chrome` with `browser`
2. [Replace callbacks with async/await](https://developer.chrome.com/docs/extensions/mv3/promises/)

And that's it! Your extension now supports Chrome, Firefox, Safari, Edge, and other Chromium browsers.

## Basic Usage

The `browser` variable is available globally via [auto-imports](/guide/auto-imports.md), or it can be imported manually.

```ts
import browser from 'wxt/browser';
```

The `wxt/browser` module exports a customized version of `webextension-polyfill`'s browser with improved typing.

### Example

Let's save the date the extension was installed. Just like `chrome`, some APIs require the permission is added to your manifest before the API is defined. Here, we need to add the `storage` permission to your manifest.

```ts
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    permissions: ['storage'],
  },
});
```

Then we can use `browser.storage` to save the install date to local storage.

```ts
// background.ts
export default defineBackground(() => {
  browser.runtime.onInstall.addEventListener(({ reason }) => {
    if (reason === 'install') {
      browser.storage.local.setItem({ installDate: Date.now() });
    }
  });
});
```

## More Examples

See the GitHub repo's [`examples/` directory](https://github.com/aklinker1/wxt/tree/main/examples) for more examples of how to use the extension APIs, including messaging, i18n, content-scripts, and more.
