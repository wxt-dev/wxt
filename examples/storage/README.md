# Storage Example

This directory contains a project with the basic setup and example usage of the `browser.storage` APIs in a WXT extension.

1. `wxt.config.ts` adds the `storage` permission to the manifest. Without this, `browser.storage` is undefined at runtime.
2. `entrypoints/background.ts` sets some values in storage.
3. `entrypoints/popup/main.ts` loads the values from storage and shows them on a UI.

See Chrome's storage documentation for more information: https://developer.chrome.com/docs/extensions/mv3/manifest/storage/
