# `@wxt-dev/module-solid`

Enables the use of [SolidJS](https://www.solidjs.com/) in your web extension, in HTML pages and content scripts.

This plugin makes a few changes:

1. Adds `vite-plugin-solid` to and sets `build.target: esnext` in the vite config
2. Adds the [`solid-js` preset](https://github.com/unjs/unimport/blob/main/src/presets/solid.ts) to auto-imports

## Usage

```sh
pnpm i solid-js
pnpm i -D @wxt-dev/module-solid
```

Then add the module to your config:

```ts
// wxt.config.ts
export default defineConfig({
  // Required
  modules: ['@wxt-dev/module-solid'],

  // Optional: Pass options to the module:
  solid: {
    vite: {
      // ...
    },
  },
});
```
