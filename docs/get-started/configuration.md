# Configuration

WXT's behavior can be configured via the `wxt.config.ts` file. In this file, you can add Vite plugins, change the directory strucutre of your project, and provide permissions or other fields to the `<outdir>/manifest.json`.

However, since WXT is an opinionated framework, some things cannot be configured.

## Config File

To configure WXT, create a `wxt.config.ts` file in your project root. It should have the following contents:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  // My WXT config
});
```

:::info
See the [API reference](/api.md) for a full list of options.
:::

## Directory Config

WXT allows you to edit several directories to your liking:

- `root` (default: `process.cwd()`) - Root of the WXT project
- `srcDir` (default: `<root>`) - Location of all your source code
- `entrypointsDir` (default: `<srcDir>/entrypoints`) - Folder containing all the entrypoints.
- `publicDir` (default: `<srcDir>/public`) - Folder containing [public assets](/get-started/assets.md)

### Example

If you want a `src/` directory to contain all your source code, and you want to rename `entrypoints/` to `entries/`, your config would look like this:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entries',
});
```

## Vite Config

Vite is the bundler used to build each part of an extension. Vite can be configured via the `vite` option.

### Example

A common reason to configure Vite is to add plugins:

```ts
import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  vite: {
    plugins: [vue()],
  },
});
```
