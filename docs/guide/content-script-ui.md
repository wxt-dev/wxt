# Content Script UI

There are three ways to mount a UI inside a content script:

[[toc]]

Each has their own set of advantages and disadvantages.

| Method      | Isolated Styles |   Isolated Events   | HMR | Use page's context |
| ----------- | :-------------: | :-----------------: | :-: | :----------------: |
| Integrated  |       ❌        |         ❌          | ❌  |         ✅         |
| Shadow Root |       ✅        | ✅ (off by default) | ❌  |         ✅         |
| IFrame      |       ✅        |         ✅          | ✅  |         ❌         |

## Integrated

Integrated content script UIs are injected alongside the content of a page. This means that they are affected by CSS on that page.

:::code-group

```ts [Vanilla]
// entrypoints/example-ui.content.ts
export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: (container) => {
        // Append children to the container
        const app = document.createElement('p');
        app.textContent = '...';
        container.append(app);
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

```ts [Vue]
// entrypoints/example-ui.content/index.ts
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: (container) => {
        // Create the app and mount it to the UI container
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        app.unmount();
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

```tsx [React]
// entrypoints/example-ui.content/index.tsx
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: (container) => {
        // Create a root on the UI container and render a component
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        // Unmount the root when the UI is removed
        root.unmount();
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

```ts [Svelte]
// entrypoints/example-ui.content/index.ts
import App from './App.svelte';

export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: (container) => {
        // Create the Svelte app inside the UI container
        const app = new App({
          target: container,
        });
        return app;
      },
      onRemove: (app) => {
        // Destroy the app when the UI is removed
        app.$destroy();
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

```tsx [Solid]
// entrypoints/example-ui.content/index.ts
import { render } from 'solid-js/web';

export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: (container) => {
        // Render your app to the UI container
        const unmount = render(() => <div>...</div>, container);
      },
      onRemove: (unmount) => {
        // Unmount the app when the UI is removed
        unmount();
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

:::

See the [API Reference](/api/wxt/client/functions/createIntegratedUi) for the complete list of options.

You can control how CSS is injected for an integrated content script UI with the [`cssInjectionMode`](/api/wxt/interfaces/BaseContentScriptEntrypointOptions#cssinjectionmode) property. Usually, you'll want to leave it as `"manifest"`, the default, so the UI inherits its style from the website's CSS.

## Shadow Root

Often in web extensions, you don't want your content script's CSS affecting the page, or vise-versa. The [`ShadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) API is ideal for this.

WXT's [`createShadowRootUi`](/api/wxt/client/functions/createShadowRootUi) abstracts all the `ShadowRoot` setup away, making it easy to create UIs with isolated CSS. It also supports an optional `isolateEvents` parameter to further isolate user interactions.

To use `createShadowRootUi`, follow these steps:

1. Import your CSS file at the top of your content script
2. Set [`cssInjectionMode: "ui"`](/api/wxt/interfaces/BaseContentScriptEntrypointOptions#cssinjectionmode) inside `defineContentScript`
3. Define your UI with `createShadowRootUi()`
4. Mount the UI so it is visible to users

:::code-group

```ts [Vanilla]
// 1. Import the style
import './style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      onMount(container) {
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

```ts [Vue]
// 1. Import the style
import './style.css';
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      onMount: (container) => {
        // Define how your UI will be mounted inside the container
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        app?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

```tsx [React]
// 1. Import the style
import './style.css';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      onMount: (container) => {
        // Container is a body, and React warns when creating a root on the body, so create a wrapper div
        const app = document.createElement('div');
        container.append(app);

        // Create a root on the UI container and render a component
        const root = ReactDOM.createRoot(app);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        // Unmount the root when the UI is removed
        root?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

```ts [Svelte]
// 1. Import the style
import './style.css';
import App from './App.svelte';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      onMount: (container) => {
        // Create the Svelte app inside the UI container
        const app = new App({
          target: container,
        });
        return app;
      },
      onRemove: (app) => {
        // Destroy the app when the UI is removed
        app?.$destroy();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

```tsx [Solid]
// 1. Import the style
import './style.css';
import { render } from 'solid-js/web';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      onMount: (container) => {
        // Render your app to the UI container
        const unmount = render(() => <div>...</div>, container);
      },
      onRemove: (unmount) => {
        // Unmount the app when the UI is removed
        unmount?.();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

:::

See the [API Reference](/api/wxt/client/functions/createShadowRootUi) for the complete list of options.

:::info TailwindCSS
`createShadowRootUi` supports TailwindCSS out of the box! When importing the styles, just import the main CSS file containing the `@tailwind` directives, and everything will just work :+1:.
:::

## IFrame

If you don't need to run your UI in the same frame as the content script, you can use an IFrame to host your UI instead. Since an IFrame just hosts an HTML page, **_HMR is supported_**.

WXT provides a helper function, [`createIframeUi`](/api/wxt/client/functions/createIframeUi), which simplifies setting up the IFrame.

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
1. Add the page to the manifest's `web_accessible_resources`
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
     matches: ['<all_urls>'],

     async main(ctx) {
       // Define the UI
       const ui = await createIframeUi(ctx, {
         page: '/example-iframe.html',
         position: 'inline',
         onMount: (wrapper, iframe) => {
           // Add styles to the iframe like width
           iframe.width = 123;
         },
       });

       // Show UI to user
       ui.mount();
     },
   });
   ```

See the [API Reference](/api/wxt/client/functions/createIframeUi) for the complete list of options.
