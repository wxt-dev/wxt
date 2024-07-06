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

:::warning UNEXPECTED BEHAVIOR
Due to the way WXT implements vite builds, the plugin may not work as expected. You may open a [GitHub issue](https://github.com/wxt-dev/wxt/issues) to report this problem.
:::
