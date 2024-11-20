---
outline: false
---

# FAQ

Commonly asked questions about how to use WXT or why it behaves the way it does.

[[toc]]

## Why aren't content scripts added to the manifest?

During development, WXT registers content scripts dynamically so they can be reloaded individually when a file is saved without reloading your entire extension.

To list the content scripts registered during development, open the service worker's console and run:

```js
await chrome.scripting.getRegisteredContentScripts();
```

## How do I disable opening the browser automatically during development?

See https://wxt.dev/guide/essentials/config/browser-startup.html#disable-opening-browser

## How do I stay logged into a website during development?

See https://wxt.dev/guide/essentials/config/browser-startup.html#persist-data

## My component library doesn't work in content scripts!

Component libraries place their CSS in the document's `<head>` by default. When using `createShadowRoot`, your UI is isolated from the document's styles because it's inside a ShadowRoot.

To fix this, you need to tell your component library to insert it's CSS inside the shadow root. Here's the docs for a couple of popular libraries:

- React
  - Ant Design: [`StyleProvider`](https://ant.design/docs/react/compatible-style#shadow-dom-usage)
  - Mantine: [`MantineProvider#getRootElement` and `MantineProvider#cssVariablesSelector`](https://mantine.dev/theming/mantine-provider/)

> If your library isn't listed above, try searching it's docs/issues for "shadow root", "shadow dom", or "css container".

`createShadowRoot` provides it's own `<head>` element inside the shadow root, so that were you should tell the library to add the CSS. Here's an example with Ant Design:

```tsx
import { StyleProvider } from '@ant-design/cssinjs'; // [!code ++]
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const ui = await createShadowRootUi(ctx, {
  name: 'example-ui',
  position: 'inline',
  anchor: 'body',
  onMount: (container) => { // [!code --]
  onMount: (container, shadow) => { // [!code ++]
    const cssContainer = shadow.querySelector("head")!; // [!code ++]
    const root = ReactDOM.createRoot(container);
    root.render(
      <StyleProvider container={cssContainer}> // [!code ++]
        <App />
      </StyleProvider> // [!code ++]
    );
    return root;
  },
  onRemove: (root) => {
    root?.unmount();
  },
});
```

Note that this doesn't effect all component libraries, just ones that inject CSS themselves rather than having you import their CSS. This approach is more prevailent in the React community, but not limited to it. That's why only React libraries are listed above. Vuetify, for example, works just fine because you import its CSS - WXT picks up on this and the CSS is added inside the shadow root automatically:

```ts
import 'vuetify/styles'; // <-- This line imports the CSS, just like importing a .css file
import { createVuetify } from 'vuetify';
```
