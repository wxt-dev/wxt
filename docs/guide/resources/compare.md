# Compare

Lets compare the features of WXT vs [Plasmo](https://docs.plasmo.com/framework) (another framework) and [CRXJS](https://crxjs.dev/guide/introduction) (a bundler plugin).

## Overview

- ✅ - Full support
- 🟡 - Partial support
- ❌ - No support

| Features                                                |   WXT   | Plasmo  |  CRXJS  |
| ------------------------------------------------------- | :-----: | :-----: | :-----: |
| Maintained                                              |   ✅    | 🟡 [^a] | 🟡 [^b] |
| Supports all browsers                                   |   ✅    |   ✅    | 🟡 [^c] |
| MV2 Support                                             |   ✅    |   ✅    | 🟡 [^d] |
| MV3 Support                                             |   ✅    |   ✅    | 🟡 [^d] |
| Create Extension ZIPs                                   |   ✅    |   ✅    |   ❌    |
| Create Firefox Sources ZIP                              |   ✅    |   ❌    |   ❌    |
| First-class TypeScript support                          |   ✅    |   ✅    |   ✅    |
| Entrypoint discovery                                    | ✅ [^e] | ✅ [^e] |   ❌    |
| Inline entrypoint config                                |   ✅    |   ✅    | ❌ [^f] |
| Auto-imports                                            |   ✅    |   ❌    |   ❌    |
| Reusable module system                                  |   ✅    |   ❌    |   ❌    |
| Supports all frontend frameworks                        |   ✅    | 🟡 [^g] |   ✅    |
| Framework specific entrypoints (like `Popup.tsx`)       | 🟡 [^h] | ✅ [^i] |   ❌    |
| Automated publishing                                    |   ✅    |   ✅    |   ❌    |
| Unlisted HTML Pages                                     |   ✅    |   ✅    |   ✅    |
| Unlisted Scripts                                        |   ✅    |   ❌    |   ❌    |
| ESM Content Scripts                                     | ❌ [^j] |   ❌    |   ✅    |
| <strong style="opacity: 50%">Dev Mode</strong>          |         |         |         |
| `.env` Files                                            |   ✅    |   ✅    |   ✅    |
| Opens browser with extension installed                  |   ✅    |   ❌    |   ❌    |
| HMR for UIs                                             |   ✅    | 🟡 [^k] |   ✅    |
| Reload HTML Files on Change                             |   ✅    | 🟡 [^l] |   ✅    |
| Reload Content Scripts on Change                        |   ✅    | 🟡 [^l] |   ✅    |
| Reload Background on Change                             | 🟡 [^l] | 🟡 [^l] | 🟡 [^l] |
| Respects Content Script `run_at`                        |   ✅    |   ✅    | ❌ [^m] |
| <strong style="opacity: 50%">Built-in Wrappers</strong> |         |         |         |
| Storage                                                 |   ✅    |   ✅    | ❌ [^n] |
| Messaging                                               | ❌ [^n] |   ✅    | ❌ [^n] |
| Content Script UI                                       |   ✅    |   ✅    | ❌ [^n] |
| I18n                                                    |   ✅    |   ❌    |   ❌    |

[^a]: Appears to be in maintenance mode with little to no maintainers nor feature development happening and _(see [wxt-dev/wxt#1404 (comment)](https://github.com/wxt-dev/wxt/pull/1404#issuecomment-2643089518))_

[^b]: See [crxjs/chrome-extension-tools#974](https://github.com/crxjs/chrome-extension-tools/discussions/974)

[^c]: As of `v2.0.0-beta.23`, but v2 stable hasn't been released yet.

[^d]: Either MV2 or MV3, not both.

[^e]: File based.

[^f]: Entrypoint options all configured in `manifest.json`.

[^g]: Only React, Vue, and Svelte.

[^h]: `.html`, `.ts`, `.tsx`.

[^i]: `.html`, `.ts`, `.tsx`, `.vue`, `.svelte`.

[^j]: WIP, moving very slowly. Follow [wxt-dev/wxt#357](https://github.com/wxt-dev/wxt/issues/357) for updates.

[^k]: React only.

[^l]: Reloads entire extension.

[^m]: ESM-style loaders run asynchronously.

[^n]: There is no built-in wrapper around this API. However, you can still access the standard APIs via `chrome`/`browser` globals or use any 3rd party NPM package.
