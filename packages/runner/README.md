# `@wxt-dev/runner`

Programmatically open a browser and install a web extension from a local directory.

## Usage

### With WXT

See WXT's [browser startup docs](https://wxt.dev/guide/essentials/config/browser-startup.html).

### JS API

Pass a directory to the `run` function to install an extension and open the browser.

```ts
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: '/path/to/extension',
  // Other options...
});
```

## Features

- ✅ Supports all Chromium and Firefox based browsers
- 🧪 Zero dependencies
- 🎉 One-line config for persisting data between launches

## Requirements

`@wxt-dev/runner` requires a JS runtime that implements the `WebSocket` standard:

| JS Runtime | Version     |
| ---------- | ----------- |
| NodeJS     | &ge; 22.4.0 |
| Bun        | &ge; 1.2.0  |

You also need to have a specific version of the browser installed that supports the latest features so extensions can be loaded:

| Browser  | Version | Release Date  |
| -------- | :-----: | :-----------: |
| Chromium | &ge;126 | June 11, 2024 |
| Firefox  | &ge;139 | May 27, 2025  |

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

### Data Persistence

Browsers block you from using your normal browser profiles when using the [BiDi and CDP protocols](#implementation-details) for security reasons.

To change how the new profile's data is saved between sessions, use the `dataPersistence` option:

```ts
import { run } from '@wxt-dev/runner';

await run({
  dataPersistence: 'user',
});
```

- `"none"` (default): Use a new profile every time the browser is opened
- `"project"`: Store user data in `.wxt-runner` (or `.wxt/runner` for WXT projects) so it is reused by future sessions for this project.
- `"user"`: Store user data in `$HOME/.wxt-runner` so it is reused by future sessions for all your projects.

These presets configure different flags for different operating systems when spawning the browser process.

If you want to customize your data persistence beyond what these presets define, [you can override the browser flags yourself](#Arguments) to configure persistence.

### Browser Binaries

`@wxt-dev/runner` will look for browser binaries/executables in [a hard-coded list of paths](https://github.com/wxt-dev/wxt/blob/main/packages/runner/src/browser-paths.ts). It does not and will not explore your filesystem/`$PATH` to find where the browser is installed. That means there are times you will need to specify the path to a browser's binary on your system:

- Your browser's path is non-standard or missing from the hard-coded list.
- You want to use a specific version/release of the browser.
- You're using a less popular browser and `@wxt-dev/runner` doesn't have hard-coded paths for it.

To do this, use the `browserBinaries` option and set the path to the target's binary:

```ts
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: 'path/to/extension',
  browserBinaries: {
    chrome: '/path/to/chrome',
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

### Debugging

To see debug logs, set the `DEBUG` env var to `"@wxt-dev/runner"`. This will print the resolved config, commands used to spawn the browser, any messages sent on the browser's communication protocol, and more for you to debug.

<details>
<summary>Example debug output</summary>

```
@wxt-dev/runner:options User options: { extensionDir: 'demo-extension', target: undefined }
@wxt-dev/runner:options Resolved options: {
  browserBinary: '/usr/bin/chromium',
  chromiumArgs: [
    '--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,CertificateTransparencyComponentUpdater,AutofillServerCommunication,PrivacySandboxSettings4',
    '--disable-component-extensions-with-background-pages',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-client-side-phishing-detection',
    '--disable-sync',
    '--metrics-recording-only',
    '--disable-default-apps',
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-background-timer-throttling',
    '--disable-ipc-flooding-protection',
    '--password-store=basic',
    '--use-mock-keychain',
    '--force-fieldtrials=*BackgroundTracing/default/',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-domain-reliability',
    '--propagate-iph-for-testing',
    '--remote-debugging-port=0',
    '--remote-debugging-pipe',
    '--user-data-dir=/tmp/wxt-runner-pWXLO1',
    '--enable-unsafe-extension-debugging'
  ],
  dataDir: '/tmp/wxt-runner-pWXLO1',
  dataPersistence: 'none',
  chromiumRemoteDebuggingPort: 0,
  extensionDir: '/home/aklinker1/Development/github.com/wxt-dev/wxt/packages/runner/demo-extension',
  firefoxArgs: [
    '--new-instance',
    '--no-remote',
    '--profile',
    '/tmp/wxt-runner-pWXLO1',
    '--remote-debugging-port=0',
    'about:debugging#/runtime/this-firefox'
  ],
  firefoxRemoteDebuggingPort: 0,
  target: 'chrome'
}
@wxt-dev/runner:chrome:stderr DevTools listening on ws://127.0.0.1:38397/devtools/browser/93dc4de5-64cb-4e0b-a9d3-7549527015f0
@wxt-dev/runner:cdp Sending command: {
  id: 1,
  method: 'Extensions.loadUnpacked',
  params: {
    path: '/home/aklinker1/Development/github.com/wxt-dev/wxt/packages/runner/demo-extension'
  }
}
@wxt-dev/runner:cdp Received response: { id: 1, result: { id: 'hckhakegfgenefhikdcfkaaonnclljmf' } }
```

</details>

## Implementation Details

`@wxt-dev/runner` spawns a child process using the target browser's binary path and some default flags. Then it uses the browser's remote protocol to install the extension.

### Firefox

We use the new [WebDriver BiDi protocol](https://www.w3.org/TR/webdriver-bidi) to install the extension. This just involves connecting to a web socket and sending a few messages.

### Chrome

We use the [CDP](https://chromedevtools.github.io/devtools-protocol/) with `--remote-debugging-pipe` and `--enable-unsafe-extension-debugging` to install the extension by sending a message via IO pipes 3 and 4.

We don't use Webdriver Bidi because it's not built into Chrome yet. It requires us instantiating a separate child process for `chromedriver`. This is slower and more difficult than just using the CDP built into Chrome.
