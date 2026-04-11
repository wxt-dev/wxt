# Favicons

[Chrome Docs](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)

Chromium-based browsers expose cached favicons through the `_favicon/` URL served from your extension. To use it, declare the `favicon` permission in your manifest and call `browser.runtime.getURL` with a `_favicon/` path:

```ts
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    permissions: ['favicon'],
  },
});
```

```ts
// Any entrypoint
function getFaviconUrl(pageUrl: string, size = 16) {
  const url = new URL(browser.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  return url.toString();
}
```

::: warning Chromium only
The favicon API is only available on Chromium-based browsers. Firefox has no equivalent, so `/_favicon/` URLs will not resolve at runtime there. If your extension supports both browsers, gate favicon usage behind `import.meta.env.CHROME` (or similar) and declare the permission per-browser.
:::

## Usage from a content script

WXT does **not** add a `web_accessible_resources` entry for `_favicon/*` — not every extension needs one, and adding it unconditionally would expose internals to sites that don't need them. If you want to load a favicon inside a content script (for example, as an `<img src>`), add your own entry in `wxt.config.ts`:

```ts
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    permissions: ['favicon'],
    web_accessible_resources: [
      {
        resources: ['_favicon/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
```
