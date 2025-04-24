---
outline: deep
---

# Browser Startup

> See the [API Reference](/api/reference/wxt/interfaces/WebExtConfig) for a full list of config.

During development, WXT uses [`web-ext` by Mozilla](https://www.npmjs.com/package/web-ext) to automatically open a browser window with your extension installed.

:::danger
Chrome 137 removed support for the `--load-extension` CLI flag, which WXT relied on to open the browser with an extension installed. So this feature will not work for Chrome.

You have two options:

1. Install [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) (which still supports the `--load-extension` flag) and [point the `chrome` binary to it](#set-browser-binaries), or
2. [Disable this feature](#disable-opening-browser) and manually load your extension

:::

## Config Files

You can configure browser startup in 3 places:

1. `<rootDir>/web-ext.config.ts`: Ignored from version control, this file lets you configure your own options for a specific project without affecting other developers

   ```ts [web-ext.config.ts]
   import { defineWebExtConfig } from 'wxt';

   export default defineWebExtConfig({
     // ...
   });
   ```

2. `<rootDir>/wxt.config.ts`: Via the [`webExt` config](/api/reference/wxt/interfaces/InlineConfig#webext), included in version control
3. `$HOME/web-ext.config.ts`: Provide default values for all WXT projects on your computer

## Recipes

### Set Browser Binaries

To set or customize the browser opened during development:

```ts [web-ext.config.ts]
export default defineWebExtConfig({
  binaries: {
    chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
    firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
    edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
  },
});
```

By default, WXT will try to automatically discover where Chrome/Firefox are installed. However, if you have chrome installed in a non-standard location, you need to set it manually as shown above.

### Persist Data

By default, to keep from modifying your browser's existing profiles, `web-ext` creates a brand new profile every time you run the `dev` script.

Right now, Chromium based browsers are the only browsers that support overriding this behavior and persisting data when running the `dev` script multiple times.

To persist data, set the `--user-data-dir` flag:

:::code-group

```ts [Mac/Linux]
export default defineWebExtConfig({
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
});
```

```ts [Windows]
import { resolve } from 'node:path';

export default defineWebExtConfig({
  // On Windows, the path must be absolute
  chromiumProfile: resolve('.wxt/chrome-data'),
  keepProfileChanges: true,
});
```

:::

Now, next time you run the `dev` script, a persistent profile will be created in `.wxt/chrome-data/{profile-name}`. With a persistent profile, you can install devtools extensions to help with development, allow the browser to remember logins, etc, without worrying about the profile being reset the next time you run the `dev` script.

:::tip
You can use any directory you'd like for `--user-data-dir`, the examples above create a persistent profile for each WXT project. To create a profile for all WXT projects, you can put the `chrome-data` directory inside your user's home directory.
:::

### Disable Opening Browser

If you prefer to load the extension into your browser manually, you can disable the auto-open behavior:

```ts [web-ext.config.ts]
export default defineWebExtConfig({
  disabled: true,
});
```
