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
  cssInjectionMode: undefined | "manifest" | "manual" | "ui",

  main(ctx) {
    // Executed when content script is loaded
  },
});
```

> All manifest options default to `undefined`.

When defining multiple content scripts, content script entrypoints that have the same set of options will be merged into a single `content_script` item in the manifest.

## Context

Old content scripts are not automatically stopped when an extension updates and reloads. Often, this leads to "Invalidated context" errors in production when a content script from an old version of your extension tries to use a extension API.

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

## UI

WXT provides a utility function, `createContentScriptUi` to simplify mounting a UI from a content script. Internally, it uses the `ShadowRoot` API to isolate your CSS from the webpages.

`createContentScriptUi` requires a `ContentScriptContext` so that when the context is invalidated, the UI is automatically removed from the webpage.

:::details When to use `createContentScriptUi`
You should only use `createContentScriptUi` if you want your UI's styles isolated from the webpages. If you want to create a more "integrated" UI that uses the page's styles, you can just use the regular JS API's to append your UI to the page.

```ts
const ui = document.createElement('div');
const anchor = document.querySelector('#anchor-selector');
anchor.append(ui);
```

:::

### Usage

To use `createContentScriptUi`, follow these steps:

1. Import your CSS file at the top of your content script
2. Set `cssInjectionMode: "ui"` inside `defineContentScript`
3. Call `createContentScriptUi`
4. Call `ui.mount()` to add the UI to the webpage

Here's a basic example:

```ts
// entrypoints/ui.content/index.ts
import './style.css';

export default defineContentScript({
  // ...
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createContentScriptUi(ctx, {
      name: 'example-ui',
      type: 'inline',
      anchor: '#some-element',
      append: 'after',
      mount(container) {
        // Mount UI inside `container`...
      },
    });

    // Yoy must call `mount` to add the UI to the page.
    ui.mount();
  },
});
```

If you're using a frontend framework, you'll also need to include an `onRemoved` callback:

:::code-group

```ts [Vue]
import { createApp } from 'vue';

createContentScriptUi(ctx, {
  // ...
  mount(container) {
    // Create a new app and mount it inside the container
    const app = createApp(...);
    app.mount(container);
    return app;
  },
  onRemove(app) {
    // When the UI is removed from the DOM, call unmount to stop the app
    app.unmount();
  },
});
```

```ts [React]
import ReactDOM from 'react-dom/client';

createContentScriptUi(ctx, {
  // ...
  mount(container) {
    // Create a root using the container and render your app
    const root = ReactDOM.createRoot(container);
    root.render(...);
    return root;
  },
  onRemove(root) {
    // When the UI is removed from the DOM, call unmount to stop the app
    root.unmount();
  },
});
```

```ts [Svelte]
import App from './App.svelte';

createContentScriptUi(ctx, {
  // ...
  mount(container) {
    // Mount your app component inside the container
    return new App({
      target: container,
    });
  },
  onRemove(app) {
    // When the UI is removed from the DOM, call $destroy to stop the app
    app.$destroy();
  },
});
```

```ts [Solid]
import { render } from 'solid-js/web';

createContentScriptUi(ctx, {
  // ...
  mount(container) {
    // Render your app component into the container
    return render(() => ..., container)
  },
  onRemove(unmount) {
    // When the UI is removed from the DOM, call unmount to stop the app
    unmount();
  },
});
```

:::

### `anchor`

The anchor dictates where the UI will be mounted.

### `append`

Customize where the UI get's appended to the DOM, relative to the `anchor` element.

### `type`

There are 3 types of UI's you can mount.

- `inline`: Shows up inline based on the `anchor` and `append` options
- `overlay`: Shows up inline, but styled to be 0px by 0px, with overflow visible. This causes the UI to overlay on top of the webpage's content
- `modal`: A fullscreen overlay that covers the entire screen, regardless of where it's anchored.

> TODO: Add visualization of the different UI types.

### Overlay `alignment`

Because the overlay UI type results in a 0px by 0px container being added to the webpage, the `alignment` option allows you to configure which corner of your UI is aligned with the 0x0 element.

> TODO: Add visualization of the different alignments.
