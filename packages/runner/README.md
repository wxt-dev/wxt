# `@wxt-dev/runner`

> [!NOTE]
> This package is still in development and is not ready for production use.

Programmatically open a browser and install a web extension from a local directory.

## TODO

- [x] Provide install functions to allow hooking into already running instances of Chrome/Firefox
  - [ ] Try to setup E2E tests on Firefox with Puppeteer using this approach
  - [ ] Try to setup E2E tests on Chrome with Puppeteer using this approach

## Features

- Supports all Chromium and Firefox based browsers
- Zero dependencies
- Persist data between launches on Chrome

## Requirements

| Runtime | Version   |
| ------- | --------- |
| NodeJS  | >= 22.4.0 |
| Bun     | >= 1.2.0  |

| Browser | Version |
| ------- | ------- |
| Chrome  | Unknown |
| Firefox | >= 139  |

## Usage

```ts
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: '/path/to/extension',
});
```

## Implementation Details

On Chrome, this uses the [CDP](https://chromedevtools.github.io/devtools-protocol/) to install the extension. On Firefox, it uses the new [WebDriver BiDi protocol](https://www.w3.org/TR/webdriver-bidi).

BiDi was not used on Chrome because it requires use of the Chrome driver, which would require a post-install step to download it, plus additional startup time to spin it up.
