# Configuration

WXT's behavior can be configured via the `wxt.config.ts` file. In this file, you can add Vite plugins, change the directory structure of your project, and set fields on your `manifest.json`.

## Config File

To configure WXT, create a `wxt.config.ts` file in your project root. It should have the following contents:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  // My WXT config
});
```

:::info
See the [Config reference](/api/wxt/interfaces/InlineConfig) for a full list of options.
:::

## Directory Config

WXT allows you to edit several directories to your liking:

- `root` (default: `process.cwd()`) - Root of the WXT project
- `srcDir` (default: `<rootDir>`) - Location of all your source code
- `entrypointsDir` (default: `<srcDir>/entrypoints`) - Folder containing all the entrypoints.
- `publicDir` (default: `<srcDir>/public`) - Folder containing [public assets](/guide/assets)

### Example

You want a `src/` directory to contain all your source code, and you want to rename `entrypoints/` &rarr; `entries/`:

```
<rootDir>
├─ src/
│  └─ entries/
│     ├─ background.ts
│     └─ ...
└─ wxt.config.ts
```

Your config would look like this:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entries',
});
```

## Frontend Frameworks

Adding a framework like Vue, React, or Svelte is easy!

In the `wxt.config.ts` file, install and add the framework's Vite plugin to the config.

:::code-group

```ts [Vue]
import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  vite: () => ({
    plugins: [vue()],
  }),
});
```

```ts [React]
import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
});
```

```ts [Svelte]
import { defineConfig } from 'wxt';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  vite: () => ({
    plugins: [svelte()],
  }),
});
```

:::

:::info
Internally, WXT runs `vite build` multiple times during a single build. It can't share the same instance of some plugins between each build, so a function is used to return completely new instances of each plugin for each build.
:::
