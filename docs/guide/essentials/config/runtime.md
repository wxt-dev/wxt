# Runtime Config

There are two ways to configure runtime behavior:

- App Config File
- Environment Variables

## App Config File

> This API is still a WIP, with more features coming soon!

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

WXT provides some custom environment variables based on the current command:

| Usage                              | Type      | Description                                          |
| ---------------------------------- | --------- | ---------------------------------------------------- |
| `import.meta.env.MANIFEST_VERSION` | `2 │ 3`   | The target manifest version                          |
| `import.meta.env.BROWSER`          | `string`  | The target browser                                   |
| `import.meta.env.CHROME`           | `boolean` | Shortcut for `import.meta.env.BROWSER === "chrome"`  |
| `import.meta.env.FIREFOX`          | `boolean` | Shortcut for `import.meta.env.BROWSER === "firefox"` |
| `import.meta.env.SAFARI`           | `boolean` | Shortcut for `import.meta.env.BROWSER === "safari"`  |
| `import.meta.env.EDGE`             | `boolean` | Shortcut for `import.meta.env.BROWSER === "edge"`    |
| `import.meta.env.OPERA`            | `boolean` | Shortcut for `import.meta.env.BROWSER === "opera"`   |

You can also access all of [Vite's environment variables](https://vite.dev/guide/env-and-mode.html#env-variables):

| Usage                  | Type      | Description                                                                 |
| ---------------------- | --------- | --------------------------------------------------------------------------- |
| `import.meta.env.MODE` | `string`  | The [mode](/guide/essentials/config/build-mode) the extension is running in |
| `import.meta.env.PROD` | `boolean` | When `NODE_ENV='production'`                                                |
| `import.meta.env.DEV`  | `boolean` | Opposite of `import.meta.env.PROD`                                          |

:::details Other Vite Environment Variables
Vite provides two other environment variables, but they aren't useful in WXT projects:

- `import.meta.env.BASE_URL`: Use `browser.runtime.getURL` instead.
- `import.meta.env.SSR`: Always `false`.
  :::

### Dotenv Files

WXT supports [dotenv files the same way as Vite](https://vite.dev/guide/env-and-mode.html#env-files). Create any of the following files:

```
.env
.env.local
.env.[mode]
.env.[mode].local
```

And any environment variables listed inside them will be available at runtime:

```sh
# .env
VITE_API_KEY=...
```

```ts
await fetch(`/some-api?apiKey=${import.meta.env.VITE_API_KEY}`);
```

Remember to prefix any environment variables with `VITE_`, otherwise they won't be available at runtime, as per [Vite's convention](https://vite.dev/guide/env-and-mode.html#env-files).

## Environment Variables in App Config

You can use environment variables in the `app.config.ts` file.

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

- Define all expected environment variables in a single file
- Convert strings to other types, like booleans or arrays
- Provide default values if an environment variable is not provided
