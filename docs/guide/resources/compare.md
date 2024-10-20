# Compare

Lets compare the features of WXT vs [Plasmo](https://docs.plasmo.com/framework) (another framework) and [CRXJS](https://crxjs.dev/vite-plugin) (a bundler plugin).

## Overview

- ✅ - Full support
- 🟡 - Partial support
- ❌ - No support

| Features                                                |   WXT   | Plasmo |  CRXJS  |
| ------------------------------------------------------- | :-----: | :----: | :-----: |
| Supports all browsers                                   |   ✅    |   ✅   | 🟡[^10] |
| MV2 Support                                             |   ✅    |   ✅   | 🟡[^1]  |
| MV3 Support                                             |   ✅    |   ✅   | 🟡[^1]  |
| Create Extension ZIPs                                   |   ✅    |   ✅   |   ❌    |
| Create Firefox Sources ZIP                              |   ✅    |   ❌   |   ❌    |
| First-class TypeScript support                          |   ✅    |   ✅   |   ✅    |
| Entrypoint discovery                                    | ✅[^2]  | ✅[^2] |   ❌    |
| Inline entrypoint config                                |   ✅    |   ✅   | ❌[^9]  |
| Auto-imports                                            |   ✅    |   ❌   |   ❌    |
| Reusable module system                                  |   ✅    |   ❌   |   ❌    |
| Supports all frontend frameworks                        |   ✅    | 🟡[^3] |   ✅    |
| Framework specific entrypoints (like `Popup.tsx`)       | 🟡[^4]  | ✅[^5] |   ❌    |
| Automated publishing                                    |   ✅    |   ✅   |   ❌    |
| Remote Code Bundling (Google Analytics)                 |   ✅    |   ✅   |   ❌    |
| Unlisted HTML Pages                                     |   ✅    |   ✅   |   ✅    |
| Unlisted Scripts                                        |   ✅    |   ❌   |   ❌    |
| ESM Content Scripts                                     | ❌[^12] |   ❌   |   ✅    |
| <strong style="opacity: 50%">Dev Mode</strong>          |         |        |         |
| `.env` Files                                            |   ✅    |   ✅   |   ✅    |
| Opens browser with extension installed                  |   ✅    |   ❌   |   ❌    |
| HMR for UIs                                             |   ✅    | 🟡[^6] |   ✅    |
| Reload HTML Files on Change                             |   ✅    | 🟡[^7] |   ✅    |
| Reload Content Scripts on Change                        |   ✅    | 🟡[^7] |   ✅    |
| Reload Background on Change                             | 🟡[^7]  | 🟡[^7] | 🟡[^7]  |
| Respects Content Script `run_at`                        |   ✅    |   ✅   | ❌[^8]  |
| <strong style="opacity: 50%">Built-in Wrappers</strong> |         |        |         |
| Storage                                                 |   ✅    |   ✅   | ❌[^11] |
| Messaging                                               | ❌[^11] |   ✅   | ❌[^11] |
| Content Script UI                                       |   ✅    |   ✅   | ❌[^11] |
| I18n                                                    |   ✅    |   ❌   |   ❌    |

[^1]: Either MV2 or MV3, not both.
[^2]: File based.
[^3]: Only React, Vue, and Svelte.
[^4]: `.html` `.ts` `.tsx`.
[^5]: `.html` `.ts` `.tsx` `.vue` `.svelte`.
[^6]: React only.
[^7]: Reloads entire extension.
[^8]: ESM-style loaders run asynchronously.
[^9]: Entrypoint options all configured in `manifest.json`.
[^10]: As of `v2.0.0-beta.23`, but v2 stable hasn't been released yet.
[^11]: There is no built-in wrapper around this API. However, you can still access the standard APIs via `chrome`/`browser` globals or use any 3rd party NPM package.
[^12]: WIP, moving very slowly. Follow [wxt-dev/wxt#357](https://github.com/wxt-dev/wxt/issues/357) for updates.
