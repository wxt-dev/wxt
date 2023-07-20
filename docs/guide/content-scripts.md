# Content Scripts

[Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/content_scripts/) &bull; [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)

## Filenames

When a filename matches the pattern below, it is added as a content script in the `manifest.json`.

- `entrypoints/content.tsx?`
- `entrypoints/<name>.content.tsx?`
- `entrypoints/content/index.tsx?`
- `entrypoints/<name>.content/index.tsx?`

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

To include CSS with your content script, import the CSS file at the top of your entrypoint:

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
