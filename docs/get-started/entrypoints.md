# Entrypoints

An "entrypoint" is any HTML, JS, or CSS file that needs to be bundled and included with your extension, which will be loaded and executed by the browser.

## Defining Entrypoints

In WXT, you create an entrypoint by adding a file to the `entrypoints/` directory.

```
<rootDir>
└─ entrypoints/
   ├─ background.ts
   ├─ content.ts
   ├─ injected.ts
   └─ popup.html
```

Some entrypoint filesname patterns are reserved by WXT and effect how the manifest is generated.

- `popup` adds a `action` to the manifest
- `background` adds a background script/service worker
- `*.content.ts` adds a content script
- ...

> For a full list of recognized filenames, see the the [Entrypoints Directory guide](/guide/directory-structure/entrypoints/background).

Any other files, whether JS, CSS, or HTML, is considered "unlisted". Unlisted files, like `injected.ts` from above, are just bundled to the output directory and not added to the manifest. You can still access or load them at runtime.

## Entrypoint Options

Most entrypoints allow customizing their options in the file you define them in. This differs from regular web extension development, where all options are placed in the `manifest.json`.

WXT looks for custom options in the entrypoint, and adds them to the manifest when generated.

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
All options for each entrypoint type is listed in the [entrypoints directory docs](/guide/directory-structure/entrypoints/background).
:::
