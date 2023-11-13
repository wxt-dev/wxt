# Storage API

WXT's storage API is powered by `unstorage`. See [their docs](https://unstorage.unjs.io/usage#usage-1) for more details.

## Overview

:::code-group

```ts [native]
const { installDate } = await browser.storage.local.get('installDate');
await browser.storage.local.set({ key: 'value' });
```

```ts [wxt/browser]
const installDate = await storage.get('local:installDate');
await storage.setItem('key', 'value');
```

:::

Use the `"local:"`, `"session:"`, `"sync:"`, and `"managed:"` prefixes to specify which storage area to use.

## Customization

WXT also provides a driver for `unstorage`. To customize the `storage` object's setup, like removing the prefixes and using a single storage area, you can create your own storage:

```ts
// storage.ts
export default createStorage({
  driver: webExtensionDriver({ storageArea: 'local' }),
});
```

:::note
`wxt/browser` re-exports all of `unstorage`, which is where `createStorage` comes from.
:::
