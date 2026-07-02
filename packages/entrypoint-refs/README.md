# @wxt-dev/entrypoint-refs

WXT module that generates typed constants for every entrypoint's output bundle path.

## Install

```ts
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/entrypoint-refs'],
});
```

## Usage

After running `wxt prepare` (or starting `wxt dev`), WXT generates `.wxt/entrypoints.ts` with one exported constant per entrypoint:

```ts
// .wxt/entrypoints.ts (auto-generated, do not edit)
export const ENTRYPOINT_POPUP = 'popup.html';
export const ENTRYPOINT_BACKGROUND = 'background.js';
export const ENTRYPOINT_OVERLAY = 'content-scripts/overlay.js';
export const ENTRYPOINT_OVERLAY_CSS = 'content-scripts/overlay.css';
```

(The `_CSS` constant only exists when the content script has a sibling stylesheet — see [Content scripts with CSS](#content-scripts-with-css) below.)

Import them via the `#entrypoints` alias:

```ts
// entrypoints/background.ts
import { ENTRYPOINT_OVERLAY, ENTRYPOINT_OVERLAY_CSS } from '#entrypoints';

browser.scripting.registerContentScripts([
  {
    id: 'overlay',
    js: [ENTRYPOINT_OVERLAY],
    css: [ENTRYPOINT_OVERLAY_CSS],
    matches: ['<all_urls>'],
  },
]);
```

If you later rename `entrypoints/overlay.content.ts` to `entrypoints/badge.content.ts`, the import breaks at compile time instead of at runtime.

## Custom refs

By default the constant name comes from the entrypoint filename. To give an entrypoint a stable identifier that survives renames, set `ref` in its options:

```ts
// entrypoints/overlay.content.ts
export default defineContentScript({
  ref: 'OVERLAY',
  matches: ['<all_urls>'],
  main() {
    /* ... */
  },
});
```

Generates:

```ts
export const ENTRYPOINT_OVERLAY = 'content-scripts/overlay.js';
```

Rename the source file to `entrypoints/badge.content.ts` and the constant stays `ENTRYPOINT_OVERLAY`.

## Content scripts with CSS

When a content script has a sibling stylesheet that WXT picks up as a `content-script-style` entrypoint (file-pair like `entrypoints/overlay.content.ts` + `entrypoints/overlay.content.css`, or directory-form `entrypoints/overlay.content/index.ts` + `entrypoints/overlay.content/*.css`), a sibling `_CSS` constant is generated automatically:

```ts
export const ENTRYPOINT_OVERLAY = 'content-scripts/overlay.js';
export const ENTRYPOINT_OVERLAY_CSS = 'content-scripts/overlay.css';
```

Pass both to `registerContentScripts`. Content scripts with no CSS get only the `.js` constant.

## Constant names

| Source                                   | Generated constant      |
| ---------------------------------------- | ----------------------- |
| `entrypoints/popup.html`                 | `ENTRYPOINT_POPUP`      |
| `entrypoints/background.ts`              | `ENTRYPOINT_BACKGROUND` |
| `entrypoints/overlay.content.ts`         | `ENTRYPOINT_OVERLAY`    |
| `entrypoints/my-page.html`               | `ENTRYPOINT_MY_PAGE`    |
| `defineContentScript({ ref: 'CUSTOM' })` | `ENTRYPOINT_CUSTOM`     |

Non-alphanumeric characters collapse into `_`.

## Why

Dynamic APIs like `browser.scripting.registerContentScripts()` and `browser.runtime.getURL()` need the post-bundle path as a string — and a hardcoded `'content-scripts/overlay.js'` keeps compiling after you rename the source file, only to fail at runtime. With this module the path is a constant the type-checker sees, so a rename forces an import update.
