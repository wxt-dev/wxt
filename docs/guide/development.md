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

## Reload Extension Manually

To manually reload an extension, you normally have to visit `chrome://extensions` and click the reload button for your extension.

WXT provides a keyboard shortcut, `ctrl+E` for Windows/Linux and `cmd+E` for Mac, that will cause the extension to reload immediately, without visiting `chrome://extensions`. This will save you time.
