# Compare

Lets compare the features of WXT vs [Plasmo](https://docs.plasmo.com/framework) (another framework) and [CRXJS](https://crxjs.dev/vite-plugin) (a bundler plugin).

## Overview

| Features                                                |       WXT        |     Plasmo      |      CRXJS       |
| ------------------------------------------------------- | :--------------: | :-------------: | :--------------: |
| Supports all browsers                                   |        ✅        |       ✅        | 🟡 <sup>10</sup> |
| MV2 Support                                             |        ✅        |       ✅        | 🟡 <sup>1</sup>  |
| MV3 Support                                             |        ✅        |       ✅        | 🟡 <sup>1</sup>  |
| Create Extension ZIPs                                   |        ✅        |       ✅        |        ❌        |
| Create Firefox Sources ZIP                              |        ✅        |       ❌        |        ❌        |
| First-class TypeScript support                          |        ✅        |       ✅        |        ✅        |
| Entrypoint discovery                                    | ✅ <sup>2</sup>  | ✅ <sup>2</sup> |        ❌        |
| Inline entrypoint config                                |        ✅        |       ✅        | ❌ <sup>9</sup>  |
| Auto-imports                                            |        ✅        |       ❌        |        ❌        |
| Reusable module system                                  |        ✅        |       ❌        |        ❌        |
| Supports all frontend frameworks                        |        ✅        | 🟡 <sup>3</sup> |        ✅        |
| Framework specific entrypoints (like `Popup.tsx`)       | 🟡 <sup>4</sup>  | ✅ <sup>5</sup> |        ❌        |
| Automated publishing                                    |        ✅        |       ✅        |        ❌        |
| Remote Code Bundling (Google Analytics)                 |        ✅        |       ✅        |        ❌        |
| Unlisted HTML Pages                                     |        ✅        |       ✅        |        ✅        |
| Unlisted Scripts                                        |        ✅        |       ❌        |        ❌        |
| ESM Content Scripts                                     | ❌ <sup>12</sup> |       ❌        |        ✅        |
| <strong style="opacity: 50%">Dev Mode</strong>          |                  |                 |
| `.env` Files                                            |        ✅        |       ✅        |        ✅        |
| Opens browser with extension installed                  |        ✅        |       ❌        |        ❌        |
| HMR for UIs                                             |        ✅        | 🟡 <sup>6</sup> |        ✅        |
| Reload HTML Files on Change                             |        ✅        | 🟡 <sup>7</sup> |        ✅        |
| Reload Content Scripts on Change                        |        ✅        | 🟡 <sup>7</sup> |        ✅        |
| Reload Background on Change                             | 🟡 <sup>7</sup>  | 🟡 <sup>7</sup> | 🟡 <sup>7</sup>  |
| Respects Content Script `run_at`                        |        ✅        |       ✅        | ❌ <sup>8</sup>  |
| <strong style="opacity: 50%">Built-in Wrappers</strong> |                  |                 |                  |
| Storage                                                 |        ✅        |       ✅        | ❌ <sup>11</sup> |
| Messaging                                               | ❌ <sup>11</sup> |       ✅        | ❌ <sup>11</sup> |
| Content Script UI                                       |        ✅        |       ✅        | ❌ <sup>11</sup> |
| I18n                                                    |        ✅        |       ❌        |        ❌        |

<small>
  <sup>1</sup>: Either MV2 or MV3, not both.
  <br/><sup>2</sup>: File based.
  <br/><sup>3</sup>: Only React, Vue, and Svelte.
  <br/><sup>4</sup>: <code>.html</code> <code>.ts</code> <code>.tsx</code>.
  <br/><sup>5</sup>: <code>.html</code> <code>.ts</code> <code>.tsx</code>. <code>.vue</code> <code>.svelte</code>.
  <br/><sup>6</sup>: React only.
  <br/><sup>7</sup>: Reloads entire extension.
  <br/><sup>8</sup>: ESM-style loaders run asynchronously.
  <br/><sup>9</sup>: Entrypoint options all configured in <code>manifest.json</code>.
  <br/><sup>10</sup>: As of <code>v2.0.0-beta.23</code>, but v2 stable hasn't been released yet.
  <br/><sup>11</sup>: There is no built-in wrapper around this API. However, you can still access the standard APIs via <code>chrome</code>/<code>browser</code> globals or use any 3rd party NPM package.
  <br/><sup>12</sup>: WIP, moving very slowly. Follow <a href="https://github.com/wxt-dev/wxt/issues/357" target="_blank"><code>wxt-dev/wxt#357</code></a> for updates.
</small>
