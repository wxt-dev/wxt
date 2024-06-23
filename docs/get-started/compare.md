# Compare

Lets compare the features of WXT vs [Plasmo](https://docs.plasmo.com/framework) (another framework) and [CRXJS](https://crxjs.dev/vite-plugin) (a bundler plugin).

## Overview

| Features                                             |             WXT             |                  Plasmo                  |                  CRXJS                  |
| ---------------------------------------------------- | :-------------------------: | :--------------------------------------: | :-------------------------------------: |
| Supports all browsers                                |             ✅              |                    ✅                    |        ✅ As of `v2.0.0-beta.23`        |
| MV2 Support                                          |             ✅              |                    ✅                    |          🟡 Either MV2 or MV3           |
| MV3 Support                                          |             ✅              |                    ✅                    |          🟡 Either MV2 or MV3           |
| Create Extension ZIPs                                |             ✅              |                    ✅                    |                   ❌                    |
| Create Firefox Sources ZIP                           |             ✅              |                    ❌                    |                   ❌                    |
| First-class TypeScript support                       |             ✅              |                    ✅                    |                   ✅                    |
| Entrypoint discovery                                 |         File based          |                File based                |                   ❌                    |
| Inline entrypoint config                             |             ✅              |                    ✅                    |             Manifest based              |
| Auto-imports                                         |             ✅              |                    ❌                    |                   ❌                    |
| Supports all frontend frameworks                     |             ✅              |      🟡 Only React, Vue, and Svelte      |                   ✅                    |
| Framework specific entrypoints (like `Popup.tsx`)    |   🟡 `.html` `.ts` `.tsx`   | ✅ `.html` `.ts` `.tsx` `.vue` `.svelte` |                   ❌                    |
| Automated publishing                                 |             ✅              |                    ✅                    |                   ❌                    |
| Remote Code Bundling (Google Analytics)              |             ✅              |                    ✅                    |                   ❌                    |
| <strong style="opacity: 50%">Dev Mode</strong>       |                             |                                          |
| `.env` Files                                         |             ✅              |                    ✅                    |                   ✅                    |
| Opens browser and install extension                  |             ✅              |                    ❌                    |                   ❌                    |
| HMR for UIs                                          |             ✅              |              🟡 React only               |                   ✅                    |
| Reload HTML Files on Change                          |             ✅              |       🟡 Reloads entire extension        |                   ✅                    |
| Reload Content Scripts on Change                     |             ✅              |       🟡 Reloads entire extension        |                   ✅                    |
| Reload Background on Change                          | 🟡 Reloads entire extension |       🟡 Reloads entire extension        |       🟡 Reloads entire extension       |
| Respects Content Script `run_at`                     |             ✅              |                    ✅                    | ❌ ESM-style loaders run asynchronously |
| <strong style="opacity: 50%">Built-in Utils</strong> |                             |                                          |                                         |
| Storage                                              |             ✅              |                    ✅                    |                   ❌                    |
| Messaging                                            |             ❌              |                    ✅                    |                   ❌                    |
| Content Script UI                                    |             ✅              |                    ✅                    |                   ❌                    |
