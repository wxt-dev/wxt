# `@wxt-dev/module-react`

Enables the use of [React](https://react.dev/) in your web extension, in HTML pages and content scripts.

This plugin makes a few changes:

1. Adds `@vitejs/plugin-react` to vite
2. Adds the [`react` preset](https://github.com/unjs/unimport/blob/main/src/presets/react.ts) to auto-imports

## Usage

```sh
pnpm i react react-dom
pnpm i -D @wxt-dev/module-react
```

Then add the module to your config:

```ts
// wxt.config.ts
export default defineConfig({
  // Required
  modules: ['@wxt-dev/module-react'],

  // Optional: Pass options to the module:
  react: {
    vite: {
      // ...
    },
  },
});
```
