# Content Scripts

[Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/content_scripts/) &bull; [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)

When creating content script entrypoints, they are automatically included in the `manifest.json` along with any CSS files they import.

## Filenames

<EntrypointPatterns
  :patterns="[
    ['content.[jt]sx?', 'content-scripts/content.js'],
    ['content/index.[jt]sx?', 'content-scripts/content.js'],
    ['<name>.content.[jt]sx?', 'content-scripts/<name>.js'],
    ['<name>.content/index.[jt]sx?', 'content-scripts/<name>.js'],
  ]"
/>

## Definition

```ts
export default defineContentScript({
  // Set manifest options
  matches: string[],
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
  cssInjectionMode: undefined | "manifest" | "manual" | "ui",

  // Configure how/when content script will be registered
  registration: undefined | "manifest" | "runtime",

  main(ctx: ContentScriptContext) {
    // Executed when content script is loaded
  },
});
```

> All manifest options default to `undefined`.

When defining multiple content scripts, content script entrypoints that have the same set of options will be merged into a single `content_script` item in the manifest.

## CSS

To include CSS with your content script, import the CSS file at the top of your entrypoint.

```

<srcDir>/
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

To disable this behavior, set `cssInjectionMode` to `"manual"` or `"ui"`.

```ts
export default defineContentScript({
  matches: ['*://google.com/*', '*://duckduckgo.com/*'],
  cssInjectionMode: 'manual',

  main(ctx) {
    // ...
  },
});
```

See [Content Script UI](/guide/content-script-ui) for more info on creating UIs and including CSS in content scripts.
