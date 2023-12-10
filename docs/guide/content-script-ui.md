# Content Script UI

There are three ways to mount a UI inside a content script:

[[toc]]

Each has their own set of advantages and disadvantages.

| Method     | Isolated Styles | HMR | Use page's context |
| ---------- | :-------------: | :-: | :----------------: |
| Integrated |       ❌        | ❌  |         ✅         |
| ShadowRoot |       ✅        | ❌  |         ✅         |
| IFrame     |       ✅        | ✅  |         ❌         |

## Integrated

Integrated content script UIs use the page's CSS to inject a UI that looks like it's apart of the page.

WXT doesn't provide any utils for mounting integrated UIs yet. Here are some examples for setting up integrated UIs.

:::code-group

```ts [Vanilla]
// entrypoints/example-ui.content.ts
export default defineContentScript({
  main(ctx) {
    // Create the UI container
    const container = document.createElement('div');

    // Add UI container to the page
    const anchor = document.querySelector('#anchor');
    anchore.append(container);

    // Remove UI container when invalidated
    ctx.onInvalidated(() => {
      container.remove();
    });
  },
});
```

```ts [Vue]
// entrypoints/example-ui.content/index.ts
import { createApp } from 'vue';

export default defineContentScript({
  main(ctx) {
    // Create the UI container
    const container = document.createElement('div');

    // Create the app and mount it to the UI container
    const app = createApp(...);
    app.mount(container);

    // Add UI container to the page
    const anchor = document.querySelector('#anchor');
    anchore.append(container);

    // Unmount the app and remove UI container when invalidated
    ctx.onInvalidated(() => {
      app.unmount();
      container.remove();
    });
  },
});
```

```tsx [React]
// entrypoints/example-ui.content/index.tsx
import ReactDOM from 'react-dom/client';

export default defineContentScript({
  main(ctx) {
    // Create the UI container
    const container = document.createElement('div');

    // Create a root on the UI container and render a component
    const root = ReactDOM.createRoot(container);
    root.render(...);

    // Add UI container to the page
    const anchor = document.querySelector('#anchor');
    anchore.append(container);

    // Unmount the root and remove UI container when invalidated
    ctx.onInvalidated(() => {
      root.unmount();
      container.remove();
    });
  },
});
```

```ts [Svelete]
// entrypoints/example-ui.content/index.ts
import App from './App.svelte';

export default defineContentScript({
  main(ctx) {
    // Create the UI container
    const container = document.createElement('div');

    // Create the Svelte app inside the UI container
    const app = new App({
      target: ui,
    });

    // Add UI container to the page
    const anchor = document.querySelector('#anchor');
    anchore.append(container);

    // Destroy the app and remove UI container when invalidated
    ctx.onInvalidated(() => {
      app.$destroy();
      container.remove();
    });
  },
});
```

```tsx [Solid]
// entrypoints/example-ui.content/index.ts
import { render } from 'solid-js/web';

export default defineContentScript({
  main(ctx) {
    // Create the UI container
    const container = document.createElement('div');

    // Render your app to the UI container
    const unmount = render(() => ..., container)

    // Add UI container to the page
    const anchor = document.querySelector('#anchor');
    anchore.append(container);

    // Unmount the app and remove UI container when invalidated
    ctx.onInvalidated(() => {
      unmount();
      container.remove();
    });
  },
});
```

:::

## ShadowRoot

Often in web extensions, you don't want your content script's CSS effecting the page, or vise-versa. The [`ShadowRoot` API](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) is ideal for this. It isolates an element's style from the page's style.

WXT provides a helper function, [`createContentScriptUi`](/api/wxt/client/functions/createContentScriptUi), that abstracts all the `ShadowRoot` setup away, making it easy to create UIs with isolated styles.

To use `createContentScriptUi`, follow these steps:

1. Import your CSS file at the top of your content script
2. Set `cssInjectionMode: "ui"` inside `defineContentScript`
3. Define your UI with `createContentScriptUi()`
4. Mount the UI so it is visible to users

```ts
// 1. Import the style
import './style.css';

export default defineContentScript({
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createContentScriptUi(ctx, {
      name: 'example-ui',
      anchor: '#anchor',
      type: 'inline',
      mount(container) {
        // Define how your UI will be mounted inside the container
        const app = document.createElement('p');
        app.textContent = 'Hello world!';
        container.append(app);
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

> `createContentScriptUi` will automatically remove the UI from the page when the content script is invalidated.

See the [API Reference](/api/wxt/client/functions/createContentScriptUi) for the complete list of options.

:::info TailwindCSS
`createContentScriptUi` supports TailwindCSS out of the box! When importing the styles, just import the main CSS file containing the `@tailwind` directives, and everything will just work :+1:.
:::

When using a frontend framework for your UI, you'll need to unmount the app when the UI is removed. When defining the UI, return an app reference from the `mount` option and pass in a custom `onRemoved` option:

:::code-group

```ts [Vue]
import { createApp } from 'vue';

const ui = createContentScriptUi(ctx, {
  // ...
  mount(container) {
    const app = createApp(App);
    app.mount(container);
    return app;
  },
  onRemove(app) {
    app.unmount();
  },
});
```

```tsx [React]
import ReactDOM from 'react-dom/client';

const ui = createContentScriptUi(ctx, {
  // ...
  mount(container) {
    const root = ReactDOM.createRoot(container);
    root.render(...);
    return root;
  },
  onRemove(root) {
    root.unmount();
  },
});
```

```ts [Svelte]
import App from './App.svelte';

const ui = createContentScriptUi(ctx, {
  // ...
  mount(container) {
    return new App({ target: container });
  },
  onRemove(app) {
    app.$destry();
  },
});
```

```tsx [Solid]
import { render } from 'solid-js/web';

const ui = createContentScriptUi(ctx, {
  // ...
  mount(container) {
    return render(() => ..., container);
  },
  onRemove(unmount) {
    unmount();
  },
});
```

:::

:::warning
The `mount(container)` and `onRemove(app)` options passed into `createContentScriptUi` **_are different from_** the `ui.mount()` and `ui.remove()` functions available on the returned UI object.

You don't need to pass anything into `ui.mount()` and `ui.remove()` because **_you already defined how and where the UI will be mounted_** in the options passed into `createContentScriptUi`.
:::

## IFrame

If you don't need to run your UI in the same frame as the content script, you can use an IFrame to host your UI instead. Since an IFrame just hosts an HTML page, **_HMR is supported_**.

WXT provides a helper function, [`createContentScriptIframe`](/api/wxt/client/functions/createContentScriptUi), which simplifies setting up the IFrame.

1. Create an HTML page that will be loaded into your IFrame
   ```html
   <!-- entrypoints/example-iframe.html -->
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Your Content Script IFrame</title>
     </head>
     <body>
       <!-- ... -->
     </body>
   </html>
   ```
1. Add the page to the manifest's `web_accessible_resouces`
   ```ts
   // wxt.config.ts
   export default defineConfig({
     manifest: {
       web_accessible_resources: [
         {
           resources: ['example-iframe.html'],
           matches: [...],
         },
       ],
     },
   });
   ```
1. Create and mount the IFrame

   ```ts
   export default defineContentScript({
     // ...
     async main(ctx) {
       // Define the UI
       const ui = await createContentScriptIframe(ctx, {
         page: '/example-iframe.html',
         anchor: '#anchor',
         type: 'inline',
       });

       // Add styles to the iframe like width
       ui.iframe.width = 123;

       // Show UI to user
       ui.mount();
     },
   });
   ```

See the [API Reference](/api/wxt/client/functions/createContentScriptUi) for the complete list of options.
