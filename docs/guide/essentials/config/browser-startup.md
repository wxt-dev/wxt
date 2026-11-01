---
outline: deep
---

# Browser Startup

During development, WXT will use any of the below packages to automatically open a browser with your extension installed.

- [`web-ext` by Mozilla](https://www.npmjs.com/package/web-ext)

Just install the dependency you want WXT to use to open the browser.

## `web-ext` Usage

> See the [API Reference](/api/reference/wxt/interfaces/WebExtConfig) for a full list of config.

### Config Files

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

### Recipes

#### Set Browser Binaries

To set or customize the browser opened during development:

```ts [web-ext.config.ts]
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  binaries: {
    chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
    firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
    edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
  },
});
```

```ts [wxt.config.ts]
export default defineConfig({
  webExt: {
    binaries: {
      chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
      firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
      edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
    },
  },
});
```

By default, WXT will try to automatically discover where Chrome/Firefox are installed. However, if you have chrome installed in a non-standard location, you need to set it manually as shown above.

#### Persist Data

By default, to keep from modifying your browser's existing profiles, `web-ext` creates a brand new profile every time you run the `dev` script.

Right now, Chromium based browsers are the only browsers that support overriding this behavior and persisting data when running the `dev` script multiple times.

To persist data, set the `--user-data-dir` flag in any of the config files mentioned above:

:::code-group

```ts [Mac/Linux]
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
});
```

```ts [Windows]
import { resolve } from 'node:path';
import { defineWebExtConfig } from 'wxt';

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

#### Disable Opening Browser

If you don't want to uninstall `web-ext`, like to test in your normal profile, you can do so via `disabled: true`:

```ts [web-ext.config.ts]
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  disabled: true,
});
```

### Enabling Chrome Features

Some APIs are disabled in Chrome during development because of the default flags `web-ext` uses to launch Chrome, like the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api).

If your extension depends on new features or services, you can enable them via `chromiumArgs`:

```ts
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  chromiumArgs: [
    // For example, this flag enables the Prompt API
    '--disable-features=DisableLoadExtensionCommandLineSwitch',
  ],
});
```

There is no comprehensive list of what feature flags enable what APIs and services.

Alternatively, if you can't find a flag that enables a feature you're looking for, [disable the opening the browser during development](#disable-opening-browser) and use your regular chrome profile for development.
