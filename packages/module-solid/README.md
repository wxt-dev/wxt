# `@wxt-dev/module-solid`

Enables the use of [SolidJS](https://www.solidjs.com/) in your web extension, in HTML pages and content scripts.

This plugin makes a few changes:

1. Adds `@solidjs/vite-plugin` and sets `build.target: esnext` in the vite config
2. Adds auto-import presets for `solid-js` and `@solidjs/web`

## Usage

```sh
pnpm i solid-js @solidjs/web
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
