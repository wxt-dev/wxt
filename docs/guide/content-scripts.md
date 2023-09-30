# Content Scripts

[Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/content_scripts/) &bull; [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)

When creating content script entrypoints, they are automatically included in the `manifest.json` along with any CSS files they import.

## Filenames

<EntrypointPatterns
  :patterns="[
    ['content.(ts|tsx)', 'content-scripts/content.js'],
    ['content/index.(ts|tsx)', 'content-scripts/content.js'],
    ['<name>.content.(ts|tsx)', 'content-scripts/<name>.js'],
    ['<name>.content/index.(ts|tsx)', 'content-scripts/<name>.js'],
  ]"
/>

## Definition

```ts
export default defineContentScript({
  // Set manifest options
  matches: ['*://google.com/*', '*://duckduckgo.com/*'],
  excludeMatches: undefined | [],
  includeGlobs: undefined | [],
  excludeGlobs: undefined | [],
  allFrames: undefined | [],
  runAt: undefined | 'document_start' | 'document_end' | 'document_idle',
  matchAboutBlank: undefined | true | false,
  matchOriginAsFallback: undefined | true | false,
  world: undefined | 'ISOLATED' | 'MAIN',

  // Set include/exclude if the background should be removed from some builds
  include: undefined | string[],
  exclude: undefined | string[],

  // Configure how CSS is injected onto the page
  cssInjectionMode: undefined | "manifest" | "manual",

  main(ctx) {
    // Executed when content script is loaded
  },
});
```

> All manifest options default to `undefined`.

When defining multiple content scripts, content script entrypoints that have the same set of options will be merged into a single `content_script` item in the manifest.

## CSS

To include CSS with your content script, import the CSS file at the top of your entrypoint.

```

<srcDir>
└─ entrypoints/
   └─ overlay.content/
      ├─ index.ts
      └─ style.css
```

```ts
// entrypoints/overlay.content/index.ts
import './style.css';

export default defineContentScript({
  matches: ['*://google.com/*', '*://duckduckgo.com/*'],
  main(ctx) {
    // ...
  },
});
```

Any styles imported in your content script will be added to that content script's `css` array in your `manifest.json`:

```json
// .output/chrome-mv3/manifest.json
{
  "content_scripts": [
    {
      "matches": ["*://google.com/*", "*://duckduckgo.com/*"],
      "js": ["content-scripts/overlay.js"],
      "css": ["content-scripts/overlay.css"]
    }
  ]
}
```

## Context

Old content scripts are not automatically stopped when an extension updates and restarts. Often, this leads to "Invalidated context" errors in production when a content script from an old version of your extension tries to use a web extension API. Since it's not connected to the latest version of your extension, the browser decides to throw an error.

WXT provides a utility for managing this process: `ContentScriptContext`. An instance of this class is provided to you automatically inside the `main` function of your content script.

```ts
export default defineContentScript({
  // ...
  main(ctx: ContentScriptContext) {
    // Add custom listeners for stopping work
    ctx.onInvalidated(() => {
      // ...
    });

    // Stop fetch requests
    fetch('...url', { signal: ctx.signal });

    // Timeout utilities
    ctx.setTimeout(() => {
      // ...
    }, 5e3);
    ctx.setInterval(() => {
      // ...
    }, 60e3);
  },
});
```

The class extends [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) and provides other utilities for stopping a content script's logic once it becomes invalidated.

:::tip
When working with content scripts, **you should always use the `ctx` object to stop any async or future work.**

This prevents old content scripts from interfering with new content scripts, and prevents error messages from the console in production.
:::
