# Web Extension Polyfill

## Overview

WXT is built on top [`webextension-polyfill` by Mozilla](https://www.npmjs.com/package/webextension-polyfill). The polyfill standardizes lots of web extension APIs so they behave the same across different browsers and manifest versions.

Unlike with Chrome Extension development, which uses a `chrome` global, you need to import the `browser` variable from WXT to use the polyfill:

```ts
import { browser } from 'wxt/browser';

console.log(browser.runtime.id);
```

If you use auto-imports (enabled by default), you don't need to import this variable, it will work just like the `chrome` global:

```ts
console.log(browser.runtime.id);
```

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

You can request permissions using the [`wxt.config.ts` file](/guide/directory-structure/wxt-config-file#permissions).
