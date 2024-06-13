# `@wxt-dev/module-svelte`

Enables the use of [Svelte](https://svelte.dev/) in your web extension, in HTML pages and content scripts.

This plugin makes a few changes:

1. Adds `@sveltejs/vite-plugin-svelte` to vite
2. Adds the [`svelte` preset](https://github.com/unjs/unimport/blob/main/src/presets/vue.ts) to auto-imports

## Usage

```sh
pnpm i -D svelte @wxt-dev/module-svelte
```

Then add the module to your config:

```ts
// wxt.config.ts
export default defineConfig({
  // Required
  modules: ['@wxt-dev/module-svelte'],

  // Optional: Pass options to the module:
  svelte: {
    vite: {
      // ...
    },
  },
});
```
