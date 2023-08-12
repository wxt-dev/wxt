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

## Messaging

Follow [Chrome's message passing guide](https://developer.chrome.com/docs/extensions/mv3/messaging/) to understand how message passing works in web extensions. In Google's examples, just replace `chrome` with `browser`, and it will work in WXT.

Here's a basic request/response example:

```ts
// popup/main.ts
const res = await browser.runtime.sendMessage('ping');

console.log('res'); // "pong"
```

```ts
// background.ts
export default defineBackground(() => {
  browser.runtime.onMessage.addEventListener(
    (message, sender, sendResponse) => {
      console.log(message); // "ping"

      // Wait 1 second and respond with "pong"
      setTimeout(() => sendResponse('pong'), 1000);
      return true;
    },
  );
});
```

There are a number of message passing libraries you can use to improve the message passing experience.

Here are some that are compatible with WXT (because they are based off `webextension-polyfill` as well):

- [`@webext-core/messaging`](https://webext-core.aklinker1.io/guide/proxy-service/) - "A light-weight, type-safe wrapper around the `browser.runtime` messaging APIs"
- [`@webext-core/proxy-service`](https://webext-core.aklinker1.io/guide/messaging/) - "Create TRPC-like services that can be called from anywhere but run in the background"
- [`webext-bridge`](https://github.com/zikaari/webext-bridge) - "Messaging in Web Extensions made super easy. Out of the box."

## Browser Differences

Some APIs are only available on certain browsers or manifest versions. You will have to check if an API exists at runtime if it is not in the `browser` standard.

```ts
if ('session' in browser.storage) {
  // Do something with the non-standard session storage API
}
```

> If you're using TypeScript, knowing what is non-standard is easy! APIs that are not typed are non-standard.
