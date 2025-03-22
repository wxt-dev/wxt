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

This is usually caused by one of two things (or both) when using `createShadowRootUi`:

1. Styles are added outside the `ShadowRoot`

   :::details
   Some component libraries manually add CSS to the page by adding a `<style>` or `<link>` element. They place this element in the document's `<head>` by default. This causes your styles to be placed outside the `ShadowRoot` and it's isolation blocks the styles from being applied to your UI.

   When a library does this, **you need to tell the library where to put its styles**. Here's the documentation for a few popular component libraries:

   - Ant Design: [`StyleProvider`](https://ant.design/docs/react/compatible-style#shadow-dom-usage)
   - Mantine: [`MantineProvider#getRootElement` and `MantineProvider#cssVariablesSelector`](https://mantine.dev/theming/mantine-provider/)

   > If your library isn't listed above, try searching it's docs/issues for "shadow root", "shadow dom", or "css container". Not all libraries support shadow DOMs, you may have to open an issue to request this feature.

   Here's an example of configuring Antd's styles:

   ```tsx
   import { StyleProvider } from '@ant-design/cssinjs';
   import ReactDOM from 'react-dom/client';
   import App from './App.tsx';

   const ui = await create`ShadowRoot`Ui(ctx, {
     // ...
     onMount: (container, shadow) => {
       const cssContainer = shadow.querySelector('head')!;
       const root = ReactDOM.createRoot(container);
       root.render(
         <StyleProvider container={cssContainer}>
           <App />
         </StyleProvider>,
       );
       return root;
     },
   });
   ```

   :::

2. UI elements are added outside the `ShadowRoot`

   ::::::details
   This is mostly caused by `Teleport` or `Portal` components that render an element somewhere else in the DOM, usually in the document's `<body>`. This is usually done for dialogs or popover components. This renders the element is outside the `ShadowRoot`, so styles are not applied to it.

   To fix this, **you need to both provide a target to your app AND pass the target to the `Teleport`/`Portal`**.

   First, store the reference to the `ShadowRoot`'s `<body>` element (not the document's `<body>`):

   :::code-group

   ```ts [Vue]
   import { createApp } from 'vue';
   import App from './App.vue';

   const ui = await create`ShadowRoot`Ui(ctx, {
     // ...
     onMount: (container, shadow) => {
       const teleportTarget = shadow.querySelector('body')!;
       const app = createApp(App)
         .provide('TeleportTarget', teleportTarget)
         .mount(container);
       return app;
     },
   });
   ui.mount();
   ```

   ```tsx [React]
   // hooks/PortalTargetContext.ts
   import { createContext } from 'react';

   export const PortalTargetContext = createContext<HTMLElement>();

   // entrypoints/example.content.ts
   import ReactDOM from 'react-dom/client';
   import App from './App.tsx';
   import PortalTargetContext from '~/hooks/PortalTargetContext';

   const ui = await create`ShadowRoot`Ui(ctx, {
     // ...
     onMount: (container, shadow) => {
       const portalTarget = shadow.querySelector('body')!;
       const root = ReactDOM.createRoot(container);
       root.render(
         <PortalTargetContext.Provider value={portalTarget}>
           <App />
         </PortalTargetContext.Provider>,
       );
       return root;
     },
   });
   ui.mount();
   ```

   :::

   Then use the reference when teleporting/portaling part of your UI to a different place in the DOM:

   :::code-group

   ```vue [Vue]
   <script lang="ts" setup>
   import { Teleport } from 'vue';

   const teleportTarget = inject('TeleportTarget');
   </script>

   <template>
     <div>
       <Teleport :to="teleportTarget">
         <dialog>My dialog</dialog>
       </Teleport>
     </div>
   </template>
   ```

   ```tsx [React]
   import { useContext } from 'react';
   import { createPortal } from 'react-dom';
   import PortalTargetContext from '~/hooks/PortalTargetContext';

   const MyComponent = () => {
     const portalTarget = useContext(PortalTargetContext);

     return <div>{createPortal(<dialog>My dialog</dialog>, portalTarget)}</div>;
   };
   ```

   :::

   If you use ShadCN, [see this blog post](https://aabidk.dev/blog/building-modern-cross-browser-web-extensions-content-scripts-and-ui/#using-radixui-portals-to-move-the-dialog-to-shadow-dom).

   ::::::

Both issues have the same cause: the library puts something outside the `ShadowRoot`, and the `ShadowRoot`'s isolation prevents CSS from being applied to your UI.

Both issues have the same fix: tell the library to put elements inside the `ShadowRoot`, not outside it. See the details above for more information and example fixes for each problem.

## Is there an LLM trained on WXT's docs that I chat with?

Yes! There's a "Ask AI" button in the bottom right of the page, try it out! Or visit https://knowledge.wxt.dev/ for a fullscreen experience.

Additionally, if you want to train your own model or provide context to your editor, you can use the LLM knowledge files hosted by the site:

https://wxt.dev/knowledge/index.json

You don't need to crawl the entire website, these files already contain all the relevant docs for training a LLM on WXT. But feel free to crawl it and generate your own files if you want!

## How do I run my WXT project with docker / [devcontainers](https://containers.dev)?

To run the WXT dev server in a devcontainer, but load the dev build of your extension in your browser:

1. **Bind-mount your project directory to your host**  
   If you're using VS Code, you can open your project folder with the `Dev Containers: Open Folder in Container...` command. This keeps the folder synchronized between your host and the devcontainer, ensuring that the extension `dist` directory remains accessible from the host.

2. **Disable auto-opening the browser**  
   WXT automatically opens your browser during development, but since you're running inside a container, it won't be able to access it. Follow the instructions [here](https://wxt.dev/guide/essentials/config/browser-startup.html#disable-opening-browser) to disable browser auto-opening in your `wxt.config.ts`.

3. **Tell WXT to listen on all network interfaces**  
   To enable hot-reloading, your extension has to connect to the WXT dev server running inside your container. WXT will only listen on `localhost` by default, which prevents connections from outside the devcontainer. To fix this you can instruct WXT to listen on all interfaces with `wxt --host 0.0.0.0`.
