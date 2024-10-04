# Vite

WXT uses [Vite](https://vitejs.dev/) under the hood to bundle your extension.

This page explains how to customize your project's Vite config. Refer to [Vite's documentation](https://vite.dev/config/) to learn more about configuring the bundler.

:::tip
In most cases, you shouldn't change Vite's build settings. WXT provides sensible defaults that output a valid extension accepted by all stores when publishing.
:::

## Change Vite Config

You can change Vite's config via the `wxt.config.ts` file:

```ts
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    // Override config here, same as `defineConfig({ ... })`
    // inside vite.config.ts files
  }),
});
```

## Add Vite Plugins

To add a plugin, install the NPM package and add it to the Vite config:

```ts
// wxt.config.ts
import { defineConfig } from 'wxt';
import removeConsole from 'vite-plugin-remove-console';

export default defineConfig({
  vite: () => ({
    plugins: [removeConsole({ includes: ['log'] })],
  }),
});
```

:::warning
Due to the way WXT orchestrates Vite builds, some plugins may not work as expected. Search [GitHub issues](https://github.com/wxt-dev/wxt/issues?q=is%3Aissue+label%3A%22vite+plugin%22) if you run into issues with a specific plugin.

If an issue doesn't exist for your plugin, [open a new one](https://github.com/wxt-dev/wxt/issues/new/choose).
:::
