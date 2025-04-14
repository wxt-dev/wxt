# `@wxt-dev/runner`

Programmatically open a browser and install a web extension from a local directory.

```ts
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: '/path/to/extension',
});
```

> [!WARNING]
> This package is still in development and is not ready for production use.

## Features

- Supports all Chromium and Firefox based browsers
- Zero dependencies
- Persist data between launches on Chrome

## Requirements

`@wxt-dev/runner` requires a JS runtime that implements the `WebSocket` standard:

| JS Runtime | Version     |
| ---------- | ----------- |
| NodeJS     | &ge; 22.4.0 |
| Bun        | &ge; 1.2.0  |

You also need to have a specific version of the browser installed that supports the latest features so extensions can be loaded:

| Browser  | Version  |
| -------- | -------- |
| Chromium | Unknown  |
| Firefox  | &ge; 139 |

## TODO

- [x] Provide install functions to allow hooking into already running instances of Chrome/Firefox
  - [ ] Try to setup E2E tests on Firefox with Puppeteer using this approach
  - [ ] Try to setup E2E tests on Chrome with Puppeteer using this approach

## Options

### Target

To open a specific browser, use the `target` option:

```ts
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: 'path/to/extension',
  target: 'firefox',
});
```

Defaults to opening `chrome`. You may see type-hints for a list of popular browsers, but you can enter any string you want here.

### Browser Binaries

`@wxt-dev/runner` will look for browser installs in [common paths](https://github.com/wxt-dev/wxt/blob/runner/packages/runner/src/browser-paths.ts). Sometimes you need to specify the path to a browser's binary because:

- Your install path is non-standard
- You want to use a specific version/release of the browser
- You're using a less popular browser and `@wxt-dev/runner` doesn't have a pre-defined path for it.

To do this, use the `browserBinaries` option and set the path to the browser's binary:

```ts
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: 'path/to/extension',
  browserBinaries: {
    chrome: '/path/to/chromium',
    firefox: '/path/to/firefox',
  },
});
```

### Arguments

To pass custom arguments to the browser on startup, use the `chromiumArgs` or `firefoxArgs` options:

```ts
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: 'path/to/extension',
  chromiumArgs: ['--window-size=1920,1080'],
  firefoxArgs: ['--window-size', '1920,1080'],
});
```

### Start URLs

To open specific URLs in tabs by default, you also use the `chromiumArgs` or `firefoxArgs` options.

Any URLs passed as a CLI argument will be opened in the browser when it starts.

```ts
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: 'path/to/extension',
  chromiumArgs: ['https://example.com'],
  firefoxArgs: ['https://example.com'],
});
```

## Implementation Details

All this package does is spawn a child process to open the browser with some default flags before using remote protocols to install the extension.

### Firefox

We use the new [WebDriver BiDi protocol](https://www.w3.org/TR/webdriver-bidi) to install the extension. This just involves connecting to a web socket and sending a few messages.

### Chrome

We use the [CDP](https://chromedevtools.github.io/devtools-protocol/) with `--remote-debugging-pipe` to install the extension by sending a message via IO pipes 3 and 4.

We don't use Webdriver Bidi because it's not built into Chrome yet. It requires us instantiating a separate child process for `chromedriver`. This is slower and more difficult than just using the CDP built into Chrome.
