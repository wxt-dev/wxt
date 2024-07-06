# Vite

Under the hood, WXT uses Vite to bundle your web extension.

## Basic Vite Configuration

All of Vite's config can be customized by setting the `vite` configuration in your `wxt.config.ts` file.

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    // Same as `defineConfig({ ... })` inside vite.config.ts
  }),
});
```

## Using Plugins

Plugins can be passed into the `vite` configuration in your `wxt.config.ts` file, just like any other option.

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    plugins: [
      // ...
    ],
  }),
});
```

:::info
There are caveats with vite plugins due to the way WXT implement vite builds:
- plugins may not work out of the box
- plugins may be executed multiple times

If you encounter issues, please open a GitHub issue for the vite plugin.
:::
