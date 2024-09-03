# Handling Extension Updates

When releasing an update to your extension, there's a couple of things you need to keep in mind:

[[toc]]

## Content Script Cleanup

Old content scripts are not automatically stopped when an extension updates and reloads. Often, this leads to "Invalidated context" errors in production when a content script from an old version of your extension tries to use an extension API.

WXT provides a utility for handling this process: `ContentScriptContext`. An instance of this class is provided to you automatically inside the `main` function of each content script.

When your extension updates or reloads, the context will become invalidated, and will trigger any `ctx.onInvalidated` listeners you add:

```ts
export default defineContentScript({
  main(ctx) {
    ctx.onInvalidated(() => {
      // Do something
    });
  },
)
```

The `ctx` also provides other convenient APIs for stopping your content script without manually calling `onInvalidated` to add a listener:

1. Setting timers:
   ```ts
   ctx.setTimeout(() => { ... }, ...);
   ctx.setInterval(() => { ... }, ...);
   ctx.requestAnimationFrame(() => { ... });
   ```
1. Adding DOM events:
   ```ts
   ctx.addEventListener(window, "mousemove", (event) => { ... });
   ```
1. Implements [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) for canceling standard APIs:
   ```ts
   fetch('...', {
     signal: ctx.signal,
   });
   ```

Other WXT APIs require a `ctx` object so they can clean themselves up. For example, [`createIntegratedUi`](/guide/key-concepts/content-script-ui#integrated), [`createShadowRootUi`](/guide/key-concepts/content-script-ui#shadow-root), and [`createIframeUi`](/guide/key-concepts/content-script-ui#iframe) automatically unmount and stop a UI when the script is invalidated.

:::warning
When working with content scripts, **you should always use the `ctx` object to stop any async or future work.**

This prevents old content scripts from interfering with new content scripts, and prevents error messages from being logged to the console in production.
:::

## Testing Permission Changes

When `permissions`/`host_permissions` change during an update, depending on what exactly changed, the browser will disable your extension until the user accepts the new permissions.

You can test if your permission changes will result in a disabled extension:

- Chromium: Use [Google's Extension Update Testing tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool)
- Firefox: See their [Test Permission Requests](https://extensionworkshop.com/documentation/develop/test-permission-requests/) page
- Safari: Everyone breaks something in production eventually... 🫡 Good luck soldier

## Update Event

You can setup a callback that runs after your extension updates like so:

```ts
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'update') {
    // Do something
  }
});
```

If the logic is simple, write a unit test to cover this logic. If you feel the need to manually test this callback, you can either:

1. In dev mode, remove the `if` statement and reload the extension from `chrome://extensions`
2. Use [Google's Extension Update Testing tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool)
