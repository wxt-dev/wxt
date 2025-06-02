---
outline: deep
---

# Browser Startup

> See the [API Reference](/api/reference/wxt/interfaces/WebExtConfig) for a full list of config.

During development, WXT uses [`@wxt-dev/runner`](https://www.npmjs.com/package/@wxt-dev/runner) to automatically open a browser window with your extension installed.

:::warning
Chrome 137 removed support for the `--load-extension` CLI flag, which WXT v0.20.6 and below relied upon. The current version of WXT relies on very new APIs CDP and WebDriver Bidi.

Make sure your development browser meets these minimum requirements:

| Browser  | Minimum Version | Release Date  |
| -------- | :-------------: | :-----------: |
| Chromium |       126       | June 11, 2024 |
| Firefox  |       139       | May 27, 2025  |

- Chromium: Version 110 or higher, released
- Firefox: v139 or higher, released May 27, 2025
  :::

To use older versions of Chrome or Firefox, you can [disable the runner](#disable-opening-browser) and manually install the extension from the browsers settings.

## Config Files

You can configure browser startup in 3 places:

1. `<rootDir>/wxt.runner.config.ts`: Ignored from version control, this file lets you configure your own options for a specific project without affecting other developers

   ```ts [wxt.runner.config.ts]
   import { defineRunnerConfig } from 'wxt';

   export default defineRunnerConfig({
     // ...
   });
   ```

2. `<rootDir>/wxt.config.ts`: Via the [`runner` config](/api/reference/wxt/interfaces/InlineConfig#runner), included in version control
3. `$HOME/.wxtrunnerrc`: Provide default values for all WXT projects on your computer

## Recipes

For more information on configuring `@wxt-dev/runner`, see [`@wxt-dev/runner`'s documentation](/runner#options).

### Set Browser Binaries

To set or customize the binaries used during development for all your projects:

```ini [$HOME/.wxtrunnerrc]
# Use Chrome Beta instead of regular Chrome when targeting "chrome"
browserBinaries.chrome=/path/to/chrome-beta

# Point Firefox to a custom install location
browserBinaries.firefox=/path/to/firefox
```

By default, WXT will try to automatically discover where Chrome/Firefox are installed. However, if you have chrome installed in a non-standard location, you need to set it manually as shown above.

### Persist Data

For security reasons, browsers will not allow you to open an existing profile during development. Instead, `@wxt-dev/runner` provides a way to persist data across sessions:

```ts [wxt.runner.config.ts]
export default defineRunnerConfig({
  dataPersistence: 'project', // or "user" for using a single profile for all projects
});
```

### Disable Opening Browser

If you prefer to load the extension into your browser manually, you can disable the auto-open behavior:

```ts [wxt.runner.config.ts]
export default defineRunnerConfig({
  disabled: true,
});
```
