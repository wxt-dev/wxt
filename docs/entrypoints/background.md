# Background

[Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/manifest/background/) &bull; [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)

For MV2, the background is added as a script to the background page. For MV3, the background becomes a service worker.

## Filenames

<EntrypointPatterns
  :patterns="[
    ['background.[jt]s', 'background.js'],
    ['background/index.[jt]s', 'background.js'],
  ]"
/>

## Definition

:::warning
The main function of the background **_CANNOT BE ASYNC_**. Event listeners must be added syncronously on background startup. If your main function returns a promise, WXT will log an error.
:::

```ts
export default defineBackground(() => {
  // Executed when background is loaded
});
```

or

```ts
export default defineBackground({
  // Set manifest options
  persistent: undefined | true | false,
  type: undefined | 'module',

  // Set include/exclude if the background should be removed from some builds
  include: undefined | string[],
  exclude: undefined | string[],

  // Executed when background is loaded
  main() {
    // ...
  },
});
```

> All manifest options default to `undefined`.
