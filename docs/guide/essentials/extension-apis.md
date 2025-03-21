# Extension APIs

[Chrome Docs](https://developer.chrome.com/docs/extensions/reference/api) • [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs)

Different browsers provide different global variables for accessing the extension APIs (chrome provides `chrome`, firefox provides `browser`, etc).

WXT simplifies this - always use `browser`:

```ts
browser.action.onClicked.addListener(() => {
  // ...
});
```

Other than that, refer to Chrome and Mozilla's documentation for how to use specific APIs. Everything a normal extension can do, WXT can do as well, just via `browser` instead of `chrome`.

## Webextension Polyfill

> Since `v0.1.0`

By default, WXT uses the [`webextension-polyfill` by Mozilla](https://www.npmjs.com/package/webextension-polyfill) to make the extension API consistent between browsers.

To access types, you should import the relevant namespace from `wxt/browser`:

```ts
import { Runtime } from 'wxt/browser';

function handleMessage(message: any, sender: Runtime.Sender) {
  // ...
}
```

### Disabling the polyfill

> Since `v0.19.0`

After the release of MV3 and Chrome's official deprecation of MV2 in June 2024, the polyfill isn't really doing anything useful anymore.

You can disable it with a single line:

```ts [wxt.config.ts]
export default defineConfig({
  extensionApi: 'chrome',
});
```

This will change `wxt/browser` to simply export the `browser` or `chrome` globals based on browser at runtime:

<<< @/../packages/wxt/src/browser/chrome.ts#snippet

Accessing types is a little different with the polyfill disabled. They do not need to be imported; they're available on the `browser` object itself:

```ts
function handleMessage(message: any, sender: browser.runtime.Sender) {
  // ...
}
```

## Feature Detection

Depending on the manifest version and browser, some APIs are not available at runtime. If an API is not available, it will be `undefined`.

:::warning
Types will not help you here. The types WXT provides for `browser` assume all APIs exist. You are responsible for knowing whether an API is available or not.
:::

To check if an API is available, use feature detection:

```ts
if (browser.runtime.onSuspend != null) {
  browser.runtime.onSuspend.addListener(() => {
    // ...
  });
}
```

Here, [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) is your best friend:

```ts
browser.runtime.onSuspend?.addListener(() => {
  // ...
});
```

Alternatively, if you're trying to use similar APIs under different names (to support MV2 and MV3), you can do something like this:

```ts
(browser.action ?? browser.browser_action).onClicked.addListener(() => {
  //
});
```
