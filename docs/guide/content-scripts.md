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

  main() {
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
  main() {
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
