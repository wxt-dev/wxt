# Experimental

WXT exposes a small set of experimental options under `experimental` in `wxt.config.ts`.

:::warning
Experimental options may change without a major release. Only enable them when you need the behavior they provide.
:::

```ts [wxt.config.ts]
import { defineConfig } from 'wxt';

export default defineConfig({
  experimental: {
    // ...
  },
});
```

See the [API reference](/api/reference/wxt/interfaces/InlineConfig#experimental) for the full list of options.

## `escapeUnicode` <Badge type="warning" text="≥0.21.3" />

Enable `escapeUnicode` if Chrome fails to load a content script with an error like:

::: danger Could not load content script... it is not UTF-8 encoded
:::

Some dependencies include Unicode characters that Chrome rejects inside extensions. When enabled, WXT rewrites those characters during the build.

:::tip
This option is disabled by default because it increases build time, and most projects never encounter the problem.
:::

```ts [wxt.config.ts]
import { defineConfig } from 'wxt';

export default defineConfig({
  experimental: {
    escapeUnicode: true,
  },
});
```
