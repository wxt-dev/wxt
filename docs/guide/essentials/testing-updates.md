# Testing Updates

## Testing Permission Changes

When `permissions`/`host_permissions` change during an update, depending on what exactly changed, the browser will disable your extension until the user accepts the new permissions.

You can test if your permission changes will result in a disabled extension:

- Chromium: Use [Google's Extension Update Testing tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool)
- Firefox/Safari: Everyone breaks something in production eventually... 🫡 Good luck soldier

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
