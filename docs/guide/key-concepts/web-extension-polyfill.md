# Web Extension Polyfill

## Overview

WXT is built on top [`webextension-polyfill` by Mozilla](https://www.npmjs.com/package/webextension-polyfill). The polyfill standardizes much of web extension APIs so they behave the same across different browsers and manifest versions.

Unlike with Chrome Extension development, which uses a `chrome` global, you need to import the `browser` variable from WXT to use the polyfill:

```ts
import { browser } from 'wxt/browser';

console.log(browser.runtime.id);
```

If you use auto-imports (enabled by default), you don't need to import this variable, it will work just like the `chrome` global:

```ts
console.log(browser.runtime.id);
```

## Handling Differences

Web extensions behave **_VERY_** differently between browsers and manifest versions. You will have to handle these API differences yourself.

:::info
MDN has great compatibility tables for tracking which browsers support which APIs: [Web Extension Browser Support for JavaScript APIs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs)
:::

Lets go over a few approaches:

1. **Feature detection**: If an API isn't available, it is `undefined`. So check if that's the case before using it.

   ```ts
   if (browser.runtime.onStartup) {
     browser.runtime.onStartup.addListener(...);
   }
   ```

   If there's a similar API you can fallback on, you can do something like this:

   ```ts
   (browser.action ?? browser.browserAction).setBadgeColor('red');
   ```

2. **Check the browser**: WXT provides environment variables about which browser is being targeted.
   ```ts
   if (!import.meta.env.SAFARI) {
     // Safari doesn't implement `onStartup` correctly, so we need a custom solution
     // ...
   } else {
     browser.runtime.onStartup.addListener(...)
   }
   ```
3. **Check the manifest version**: WXT provides environment variables about which manifest version is being targeted.
   ```ts
   if (import.meta.env.MANIFEST_VERSION === 3) {
     // MV3 only code...
   } else {
     // MV2 only code...
   }
   ```

### Environment Variables

| Name                               | Type      | Description                                           |
| ---------------------------------- | --------- | ----------------------------------------------------- |
| `import.meta.env.BROWSER`          | `string`  | The target browser                                    |
| `import.meta.env.MANIFEST_VERSION` | `2 │ 3`   | The target manifest version                           |
| `import.meta.env.CHROME`           | `boolean` | equivalent to `import.meta.env.BROWSER === "chrome"`  |
| `import.meta.env.FIREFOX`          | `boolean` | equivalent to `import.meta.env.BROWSER === "firefox"` |
| `import.meta.env.SAFARI`           | `boolean` | equivalent to `import.meta.env.BROWSER === "safari"`  |
| `import.meta.env.EDGE`             | `boolean` | equivalent to `import.meta.env.BROWSER === "edge"`    |
| `import.meta.env.OPERA`            | `boolean` | equivalent to `import.meta.env.BROWSER === "opera"`   |

WXT uses Vite, so all of Vite's `import.meta.env` variables are also available:

<https://vitejs.dev/guide/env-and-mode#env-variables>

## Augmented Types

Based on the files in your project, WXT will modify some of the polyfill's types to be type-safe.

For example, `browser.runtime.getURL` will be typed to only allow getting the URL of known files.

## Missing Types

Some newer APIs that Chrome provides are missing types. But don't worry, the APIs are present at runtime! The polyfill only provides types for standard and stable APIs that work on all browsers, so just be careful when you use them.

If you're using TypeScript, you can use `@ts-expect-error` to ignore any errors when using an API that doesn't have any types.

```ts
// @ts-expect-error: desktopCapture is not typed
browser.desktopCapture.chooseDesktopMedia(...)
```

Note that when running this code in a different browser that doesn't support the `desktopCapture` API, `browser.desktopCapture` will evaluate to `undefined` and an error will be thrown.

## Missing Permissions

Just like with the `chrome` global, you need to request the required permissions to use each API. Otherwise, `browser.{apiName}` will be `undefined`.

For example, if you try to use `browser.storage.local.getItem(...)` without requesting the `storage` permission, the extension will throw an error:

```
Cannot access property "local" of undefined.
```

You can request permissions using the [`wxt.config.ts` file](/guide/directory-structure/wxt-config#permissions).
