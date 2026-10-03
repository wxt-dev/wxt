# Compare

Lets compare the features of WXT vs [Plasmo](https://docs.plasmo.com/framework) (another framework) and [CRXJS](https://crxjs.dev/vite-plugin) (a bundler plugin).

## Overview

- ✅ - Full support
- 🟡 - Partial support
- ❌ - No support

| Features                                                |   WXT   | Plasmo  |  CRXJS  |
| ------------------------------------------------------- | :-----: | :-----: | :-----: |
| Maintained                                              |   ✅    | 🟡 [^n] | 🟡 [^m] |
| Supports all browsers                                   |   ✅    |   ✅    | 🟡 [^j] |
| MV2 Support                                             |   ✅    |   ✅    | 🟡 [^a] |
| MV3 Support                                             |   ✅    |   ✅    | 🟡 [^a] |
| Create Extension ZIPs                                   |   ✅    |   ✅    |   ❌    |
| Create Firefox Sources ZIP                              |   ✅    |   ❌    |   ❌    |
| First-class TypeScript support                          |   ✅    |   ✅    |   ✅    |
| Entrypoint discovery                                    | ✅ [^b] | ✅ [^b] |   ❌    |
| Inline entrypoint config                                |   ✅    |   ✅    | ❌ [^i] |
| Auto-imports                                            |   ✅    |   ❌    |   ❌    |
| Reusable module system                                  |   ✅    |   ❌    |   ❌    |
| Supports all frontend frameworks                        |   ✅    | 🟡 [^c] |   ✅    |
| Framework specific entrypoints (like `Popup.tsx`)       | 🟡 [^d] | ✅ [^e] |   ❌    |
| Automated publishing                                    |   ✅    |   ✅    |   ❌    |
| Unlisted HTML Pages                                     |   ✅    |   ✅    |   ✅    |
| Unlisted Scripts                                        |   ✅    |   ❌    |   ❌    |
| ESM Content Scripts                                     | ❌ [^l] |   ❌    |   ✅    |
| <strong style="opacity: 50%">Dev Mode</strong>          |         |         |         |
| `.env` Files                                            |   ✅    |   ✅    |   ✅    |
| Opens browser with extension installed                  |   ✅    |   ❌    |   ❌    |
| HMR for UIs                                             |   ✅    | 🟡 [^f] |   ✅    |
| Reload HTML Files on Change                             |   ✅    | 🟡 [^g] |   ✅    |
| Reload Content Scripts on Change                        |   ✅    | 🟡 [^g] |   ✅    |
| Reload Background on Change                             | 🟡 [^g] | 🟡 [^g] | 🟡 [^g] |
| Respects Content Script `run_at`                        |   ✅    |   ✅    | ❌ [^h] |
| <strong style="opacity: 50%">Built-in Wrappers</strong> |         |         |         |
| Storage                                                 |   ✅    |   ✅    | ❌ [^k] |
| Messaging                                               | ❌ [^k] |   ✅    | ❌ [^k] |
| Content Script UI                                       |   ✅    |   ✅    | ❌ [^k] |
| I18n                                                    |   ✅    |   ❌    |   ❌    |

[^a]: Either MV2 or MV3, not both.

[^b]: File based.

[^c]: Only React, Vue, and Svelte.

[^d]: `.html`, `.ts`, `.tsx`.

[^e]: `.html`, `.ts`, `.tsx`, `.vue`, `.svelte`.

[^f]: React only.

[^g]: Reloads entire extension.

[^h]: ESM-style loaders run asynchronously.

[^i]: Entrypoint options all configured in `manifest.json`.

[^j]: As of `v2.0.0-beta.23`, but v2 stable hasn't been released yet.

[^k]: There is no built-in wrapper around this API. However, you can still access the standard APIs via `chrome`/`browser` globals or use any 3rd party NPM package.

[^l]: WIP, moving very slowly. Follow [wxt-dev/wxt#357](https://github.com/wxt-dev/wxt/issues/357) for updates.

[^m]: See [crxjs/chrome-extension-tools#974](https://github.com/crxjs/chrome-extension-tools/discussions/974)

[^n]: Appears to be in maintenance mode with little to no maintainers nor feature development happening and _(see [wxt-dev/wxt#1404 (comment)](https://github.com/wxt-dev/wxt/pull/1404#issuecomment-2643089518))_
