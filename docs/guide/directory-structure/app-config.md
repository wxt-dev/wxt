# `<srcDir>/app.config.ts`

:::warning Nuxt Users
If you're familiar with Nuxt, this file is meant to be a direct equivalent to Nuxt's `app.config.ts` file.

However, some of Nuxt's features, like overriding the app config based on a `.env` file or automatically generating the config's types, are not implemented. They are planned, just not implemented yet. Feel free to open a PR!
:::

## Overview

Define runtime configuration in a single place.

```ts
// <srcDir>/app.config.ts
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

Then access the config in your extension by calling `useAppConfig`:

```ts
console.log(useAppConfig()); // { theme: "dark" }
```

## Environment Variables

If you have a `.env` file, you can access any variables defined in it here. You can convert them to better types (like booleans), add types for them, or leave them as is.

```txt
# .env
VITE_BUG_REPORTING_DISABLED=true
VITE_API_KEY=...
```

```ts
// <srcDir>/app.config.ts

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    bugReportingDisabled: boolean;
    apiKey?: string;
  }
}

export default defineAppConfig({
  bugReportingDisabled: import.meta.env.VITE_BUG_REPORTING_DISABLED === 'true',
  apiKey: import.meta.env.VITE_API_KEY,
});
```

> You don't have to do this, you can use `import.meta.env.VITE_*` anywhere in your runtime code, but putting them here consolidates them to one place and defines what variables are expected.
