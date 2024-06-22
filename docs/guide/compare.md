# Compare

Lets compare the features of WXT vs [Plasmo](https://docs.plasmo.com/framework) (another web extension framework) and CRXJS (the most popular bundler plugin).

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

## Dev Mode

WXT's main goal is improving the development experience (DX) of creating web extensions, while not sacrificing support. There are two things WXT does differently:

1. Automatically opens a browser with the extension installed when starting development
2. Reload each part of the extension individually rather than reloading the entire extension

Opening a browser automatically makes it super easy to start and stop development without having to manually load the extension in your browser.

Reloading each part of the extension individually improves your iteration speed while developing UIs. This is because reloading the entire extension on every change will close the popup and any tabs open to an extension page, like options. If you save a file associated with a UI and a content script while working on the UI, it will randomly close because it needed to reload the extension when the content script changed. This interrupts your development flow and is really annoying.

WXT solves this problem by reloading HTML pages and content scripts individually (when possible) to keep your UIs open while you develop them. This is a MV3 feature, so if you're developing a MV2 extension, you'll get the same dev experience as Plasmo.

:::info
Unfortunately, there isn't an API for reloading the background page/service worker individually, so if you change a file used by the background, the entire extension will reload. See [Issue #53](https://github.com/wxt-dev/wxt/issues/53) for more details.
:::
