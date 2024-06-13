# `@wxt-dev/module-vue`

Enables the use of [Vue](https://vuejs.org/) in your web extension, in HTML pages and content scripts.

```sh
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
