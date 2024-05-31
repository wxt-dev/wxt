# Configuration

By default, WXT provides sensible configuration for bundling web extensions with Vite.

## Config File

To configure WXT, create a `wxt.config.ts` file in your project root. It should have the following contents:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  // My WXT config
});
```

:::info
For more information on configuring WXT via the `wxt.config.ts` file, read the dedicated [`wxt.config.ts` guide](/guide/directory-structure/wxt-config-file).
:::

## Manifest.json

WXT generates your extension's `manifest.json` based on the project structure. To add additional properties, like permissions, use the [`manifest` property](/api/reference/wxt/interfaces/InlineConfig#manifest).

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    permissions: ['storage'],
  },
});
```

:::info
For more information on configuring the manifest, read the dedicated [Manifest guide](/guide/key-concepts/manifest).
:::

## Environment

WXT can read `.env` files, and variables are accessible via `import.meta.env.*`.

:::code-group

```sh [.env]
VITE_OAUTH_CLIENT_ID=abc123
```

```ts [JS]
import.meta.env.VITE_OAUTH_CLIENT_ID;
```

:::

:::info
For more information on using .env files, read the dedicated [`.env` guide](/guide/directory-structure/env-file).
:::
