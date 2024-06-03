# Frontend Frameworks

WXT supports all frontend frameworks with a Vite plugin:

- `@vitejs/plugin-vue`
- `@vitejs/plugin-react`
- `@vitejs/plugin-react-swc`
- And more!

Just add the vite plugin to your config and you're good to go! Use the framework in HTML pages or content scripts, it will just work 👍

:::code-group

```ts [Vue]
import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  vite: () => ({
    plugins: [vue()],
  }),
});
```

```ts [React]
import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
});
```

```ts [Svelte]
import { defineConfig } from 'wxt';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  vite: () => ({
    plugins: [svelte()],
  }),
});
```

:::

## Multiple Apps

Since web extensions usually contain multiple UIs as separate HTML files (popup, options, changelog, side panel, etc), you'll need to create individual app instances, one per HTML page.

Usually, this means each entrypoint should be a directory with it's own files inside it:

```
<root>/
  ├ assets/  <------------------ Put shared assets here
  │   ├ style.css  <------------ Like styles all your pages share
  │   └ ...
  ├ components/  <-------------- Put shared components here
  │   └ ...
  └ entrypoints/
      ├ popup/  <--------------- Use a folder with an index.html file in it
      │   ├ index.html
      │   ├ main.tsx  <--------- Create and mount your app here
      │   ├ style.css  <-------- Have some global styles to apply?
      │   └ ... <--------------- Rest of the files can be named whatever
      └ options/
          ├ pages/  <------------ A good place to put your router pages
          │   ├ [id]/
          │   │   └ details.tsx
          │   ├ index.tsx
          │   └...
          ├ index.html
          ├ App.vue
          ├ main.ts
          ├ style.css
          └ rotuer.ts
```

## Configuring Routers

Lots of frameworks come with routers for building a multi-page app using the URL's path. Chrome extensions don't don't work like this. Since HTML files are static, `chrome-extension://{id}/popup.html`, there's no way to change the entire path for routing.

Instead, you need to configure the router to run in "hash" mode, where the routing information is apart of the URL's hash, not the path (ie: `popup.html#/` and `popup.html#/account/settings`)

Refer to your router's docs for information about "hash" mode and how to enable it. Here's a non-extensive list of a few popular routers:

- [React](https://reactrouter.com/en/main/routers/create-hash-router)
- [Vue](https://router.vuejs.org/guide/essentials/history-mode.html#Hash-Mode)
- [Svelte](https://www.npmjs.com/package/svelte-spa-router#hash-based-routing)
- [Solid](https://github.com/solidjs/solid-router?tab=readme-ov-file#hash-mode-router)
