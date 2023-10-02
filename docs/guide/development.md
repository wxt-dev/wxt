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

WXT uses [`web-ext` by Mozilla](https://github.com/mozilla/web-ext) to automatically open a browser with the extension installed. You can configure the runner's behavior via the [`runner`](/api/config#runner.disabled) option, or in a separate gitignored file, `web-ext.config.ts`.

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

You may also setup default for your entire computer by creating a `web-ext.config.ts` file in your home directory. This is useful if you want to specify config for all project on your computer, like that you want to use Chrome Beta instead of Chrome.

```ts
// ~/web-ext.config.ts
import { defineRunnerConfig } from 'wxt';

export default defineRunnerConfig({
  binaries: {
    chrome: '/path/to/chrome-beta',
  },
});
```
