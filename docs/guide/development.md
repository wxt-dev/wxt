# Development

WXT's main goal is providing the best DX it possibly can. When running your extension in dev mode, each part of your extension is reloaded separately when possible.

|                     | HMR | Reloaded individually | Reload extension |                    Restart browser                     |
| ------------------- | :-: | :-------------------: | :--------------: | :----------------------------------------------------: |
| HTML File           |     |          ✅           |
| HTML Dependency     | ✅  |
| MV3 Content Script  |     |          ✅           |
| MV2 Content Script  |     |                       |        ✅        |
| Background          |     |                       |        ✅        |
| manifest.json       |     |                       |                  | 🟡 See [#16](https://github.com/wxt-dev/wxt/issues/16) |
| `wxt.config.ts`     |     |                       |                  | 🟡 See [#10](https://github.com/wxt-dev/wxt/issues/10) |
| `web-ext.config.ts` |     |                       |                  | 🟡 See [#10](https://github.com/wxt-dev/wxt/issues/10) |

## Dev Mode vs Production Builds

There are some notible differences between the development and production versions of an extension. During development:

1. **Content scripts are not listed in the `manifest.json`** when targetting MV3. Instead, the [`scripting`](https://developer.chrome.com/docs/extensions/reference/api/scripting) permission is used to register content scripts at runtime so they can be reloaded individually.

   To get the list of content scripts during development, run the following in the background's console:

   ```ts
   await chrome.scripting.getRegisteredContentScripts();
   ```

2. **The CSP is modified to allow loading scripts from the dev server**. Make sure you're using Chrome v110 or above for HMR to work.

3. If you don't include a background script/service worker, one will be created to perform various tasks in dev mode, mostly related to reloading different parts of the extension on change.

For production builds, none of the above modifications will be applied, and you're extension/manifest will only include what you have defined.

## Configure Browser Startup

WXT uses [`web-ext` by Mozilla](https://github.com/mozilla/web-ext) to automatically open a browser with the extension installed. You can configure the runner's behavior via the [`runner`](/api/wxt/interfaces/InlineConfig#runner) option, or in a separate gitignored file, `web-ext.config.ts`.

:::code-group

```ts [wxt.config.ts]
import { defineConfig } from 'wxt';

export default defineConfig({
  runner: {
    // Runner config
  },
});
```

```ts [web-ext.config.ts]
import { defineRunnerConfig } from 'wxt';

export default defineRunnerConfig({
  // Runner config
});
```

:::

### Browser Binaries

`web-ext`'s browser discovery is very limitted. By default, it only guesses at where Chrome and Firefox are installed. If you've customized your install locations, you may need to tell `web-ext` where the binaries/executables are located using the [`binaries` option](/api/wxt/interfaces/ExtensionRunnerConfig#binaries). For other Chromium based browsers, like Edge or Opera, you'll need to explicitly list them in the `binaries` option as well, otherwise they will open in Chrome by default.

```ts
// ~/web-ext.config.ts
import { defineRunnerConfig } from 'wxt';

export default defineRunnerConfig({
  binaries: {
    chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
    firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
    edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
  },
});
```

:::tip
When configuring browser binaries, it's helpful to put them in `~/web-ext.config.ts` instead of the project directory's `web-ext.config.ts` file. When placed in your home directory (`~/`), this config will be used by all WXT projects, so you only need to configure the binaries once.
:::

### Other options

You can customize other options as well, like startup URLs, profiles, or additional command line arguments:

```ts
// web-ext.config.ts
import { defineRunnerConfig } from 'wxt';

export default defineRunnerConfig({
  startUrls: ['https://google.com', 'https://duckduckgo.com'],
  chromiumProfile: '/path/to/profile/to/use',
  chromiumArgs: ['--window-size=400x300'],
});
```

For a full list of options, see the [API Reference](/api/wxt/interfaces/ExtensionRunnerConfig).

## Reload the Extension

Normally, to manually reload an extension, you have to visit `chrome://extensions` and click the reload button for your extension.

When running `wxt` command to start the dev server, WXT adds a keyboard shortcut, `ctrl+E` for Windows/Linux and `cmd+E` for Mac, that reloads the extension when pressed, without visiting `chrome://extensions`.

:::info
This shortcut is only available during development, and is not be added to your extension when running `wxt build` or `wxt-zip`.
:::
