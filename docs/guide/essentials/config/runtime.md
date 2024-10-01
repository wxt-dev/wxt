# Runtime Config

There are two ways to configure runtime behavior:

- `app.config.ts`
- Environment Variables

## `app.config.ts`

:::warning
This API is still a WIP, with more features coming soon!
:::

Define runtime configuration in a single place, `<srcDir>/app.config.ts`:

```ts
import { defineAppConfig } from 'wxt/sandbox';

// Define types for your config
declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    theme?: 'light' | 'dark';
  }
}

export default defineAppConfig({
  theme: 'dark',
});
```

:::warning
This file is committed to the repo, so don't put any secrets here. Instead, use [Environment Variables](#environment-variables)
:::

To access runtime config, WXT provides the `useAppConfig` function:

```ts
import { useAppConfig } from 'wxt/sandbox';

console.log(useAppConfig()); // { theme: "dark" }
```

## Environment Variables

WXT supports environment variables through [Vite](https://vitejs.dev/guide/env-and-mode.html#env-variables). You can create `.env` and `.env.*` files just like you would with Vite:

```
VITE_API_KEY=...
```

Then access them at runtime via `import.meta.env`:

```ts
await fetch(`/some-api?apiKey=${import.meta.env.VITE_API_KEY}`);
```

### `app.config.ts` Integration

You can use them in the `app.config.ts` file.

```ts
declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    apiKey?: string;
    skipWelcome: boolean;
  }
}

export default defineAppConfig({
  apiKey: import.meta.env.VITE_API_KEY,
  skipWelcome: import.meta.env.VITE_SKIP_WELCOME === 'true',
});
```

This has several advantages:

- Define what environment variables are use at runtime in a single file
- Convert strings to nicer types, like booleans or arrays
- Provide default values if an environment variable is not provided
