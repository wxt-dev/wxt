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

Plugins can be passed into the `vite` configuration in you `wxt.config.ts` file, just like any other option.

All plugins should work in WXT, but it is worth pointing out that since WXT orchestrates multiple vite builds to bundle an extension, plugins will be executed multiple times if necessary.

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
