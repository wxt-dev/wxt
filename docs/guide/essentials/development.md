# Development

WXT's dev server rebuilds your extension as you edit files and sends updates to the browser. You can let WXT open a browser for you or load the extension into a browser yourself.

## Start the dev server

Run the `dev` script from your extension's root directory:

:::code-group

```sh [Bun]
bun run dev
```

```sh [PNPM]
pnpm dev
```

```sh [NPM]
npm run dev
```

```sh [Yarn]
yarn dev
```

:::

The starter templates use `wxt` for this script, which targets Chrome by default. With `web-ext` installed, WXT opens the browser with your extension loaded in a temporary profile. Keep the dev server running while you work.

To develop in Firefox, use the templates' `dev:firefox` script, which runs `wxt -b firefox`. See [Targeting Different Browsers](/guide/essentials/target-different-browsers) for other browsers and manifest versions.

You can configure the browser executable, startup URLs, and persistent profiles in [Browser Startup](/guide/essentials/config/browser-startup). If you close the browser WXT opened, enter `o` followed by Enter in the dev server's terminal to reopen it.

## Load the extension manually

To use a browser you already have open, create `web-ext.config.ts` in your extension's root directory:

```ts [web-ext.config.ts]
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  disabled: true,
});
```

This disables automatic browser startup. The dev server still builds the extension and sends updates after you load it. The starter templates ignore this file in Git, so the setting stays local to your computer.

Start the dev server, then load the output for your target browser. With the default output settings:

### Chrome

1. Run your `dev` script and wait for the initial build to finish.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select `.output/chrome-mv3-dev`.

### Firefox

1. Run your `dev:firefox` script and wait for the initial build to finish.
2. Open `about:debugging` and select **This Firefox**.
3. Click **Load Temporary Add-on** and select `.output/firefox-mv2-dev/manifest.json`.

Firefox removes temporary extensions when it restarts, so load the extension again after restarting Firefox.

:::tip
Load the directory printed in WXT's terminal output. It changes if you customize the output path or target a different browser or manifest version. For example, `wxt -b firefox --mv3` writes to `.output/firefox-mv3-dev` by default.
:::

## Update your extension

Automatic updates work with both browser workflows while the dev server is running:

| Change                                              | What happens                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scripts and styles used by an HTML page             | Vite updates the page, using your framework's HMR support when available.                      |
| HTML files                                          | WXT reloads the affected extension pages.                                                      |
| Content scripts                                     | WXT rebuilds the scripts. MV3 reloads the affected content scripts; MV2 reloads the extension. |
| Background scripts, manifest, or files in `public/` | WXT reloads the extension.                                                                     |
| `wxt.config.ts` or WXT modules                      | WXT restarts the dev server.                                                                   |
| `web-ext.config.ts`                                 | WXT restarts the browser when automatic browser startup is enabled.                            |

Check the terminal for build errors if a change doesn't appear. If your content script leaves UI behind when it reloads, use its [content script context](/guide/essentials/content-scripts#context) to clean it up.

## Test a production build

Before publishing, stop the dev server and run your `build` or `build:firefox` script. Load the production output manually, using the same steps above. The default directories are `.output/chrome-mv3` and `.output/firefox-mv2`.

Production builds run without the dev server. Testing them helps you catch behavior that differs from dev mode, such as [permissions added for development](/guide/essentials/config/manifest#permissions).
