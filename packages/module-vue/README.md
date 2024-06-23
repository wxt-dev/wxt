# `@wxt-dev/module-vue`

Enables the use of [Vue](https://vuejs.org/) in your web extension, in HTML pages and content scripts.

This plugin makes a few changes:

1. Adds `@vitejs/plugin-vue` to vite config
2. Adds the [`vue` preset](https://github.com/unjs/unimport/blob/main/src/presets/vue.ts) to auto-imports
3. Applies sourcemap fix to prevent HMR errors during development
4. Enable auto-imports in `.vue` files

## Usage

```sh
pnpm i vue
pnpm i -D @wxt-dev/module-vue
```

Then add the module to your config:

```ts
// wxt.config.ts
export default defineConfig({
  // Required
  modules: ['@wxt-dev/module-vue'],

  // Optional: Pass options to the module:
  vue: {
    vite: {
      script: {
        propsDestructure: true,
      },
    },
  },
});
```
