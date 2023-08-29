# Messaging Example

Example of creating different build variants for different browsers.

1. In `package.json`, pass the `-b <browser-name>` flag into `wxt build`, `wxt dev`, and `wxt zip` commands.

   > WXT uses web-ext under the hood to open a browser during development. web-ext does not support opening safari.

2. In `web-ext.config.ts`, list the binary paths to all the browsers you want to devlop against.

   > In this example, we're opening Chrome for all the chromium builds, but you could list the actual binary paths for each browser.

3. Run any of the `dev` commands to open the extension in a browser. `pnpm dev` opens Chrome, `pnpm dev:firefox` opens firefox, etc.

4. In `entrypoints/popup/main.ts`, the extension uses the predefined global constants to display which browser is being targetted.

Note that different browsers are targetted per build, the current browser is not detected at runtime. So if you want a custom build for Edge, you need to build a separate ZIP file for edge.
