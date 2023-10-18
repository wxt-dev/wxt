# Testing

WXT provides several utils for writing tests.

## Unit tests

If you're using auto-imports (enabled by default), [Vitest](https://vitest.dev/) is the only testing framework that supports them.

If you want to use a different testing library/framework (like Jest, mocha, node:test, etc), you can keep using it, but you have two options:

1. Switch to Vitest (recommended)
2. Configure the testing library manually
   - Disable auto-imports by setting `imports: false` in your `wxt.config.ts` file
   - Manually add globals normally provided by WXT (like `__BROWSER__`) that you consume to the global scope before accessing them (`globalThis.__BROWSER__ = "chrome"`)

### Vitest Setup

Install vitest and add the `WxtVitest` plugin to your `vitest.config.ts` file.

```sh
pnpm i -D vitest
```

```ts
// <root>/vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
});
```

And that's it. You're ready to start writing tests.

### Writing Tests

Here's a very basic test, written with a few different testing libraries, with a few different approaches for mocking the `browser` global.

:::code-group

```ts [Vitest]
import { describe, it, expect, vi } from 'vitest';

function logRuntimeId() {
  // Vitest automatically mocks "browser" with "fakeBrowser"
  console.log(browser.runtime.id);
}

describe('logRuntimeId', () => {
  it("should log the extension's runtime ID", () => {
    // Set a known ID on fakeBrowser for the test
    const id = 'some-runtime-id';
    fakeBrowser.runtime.id = id;
    const logSpy = vi.spyOn(console, 'log');

    logRuntimeId();

    expect(logSpy).toBeCalledWith(id);
  });
});
```

```ts [Jest - Manual Mock]
import { fakeBrowser } from 'wxt/testing';
import { browser } from 'wxt/browser';

function logRuntimeId() {
  console.log(browser.runtime.id);
}

// Manually mock
jest.mock('wxt/browser', () => {
  const { fakeBrowser } = require('wxt/testing');
  return { browser: fakeBrowser };
});

describe('logRuntimeId', () => {
  it("should log the extension's runtime ID", () => {
    // Set a known ID on fakeBrowser for the test
    const id = 'some-runtime-id';
    fakeBrowser.runtime.id = id;
    const logSpy = jest.spyOn(console, 'log');

    logRuntimeId();

    expect(logSpy).toBeCalledWith(id);
  });
});
```

```ts [node:test - Parameterized]
import { describe, it, mock } from 'node:test';
import { assert } from 'node:assert';
import { fakeBrowser } from 'wxt/testing';
import { browser } from 'wxt/browser';

// Add browser as a parameter so fakeBrowser can be passed instead of browser
function logRuntimeId(browser = browser) {
  console.log(browser.runtime.id);
}

describe('logRuntimeId', () => {
  it("should log the extension's runtime ID", () => {
    // Set a known ID on fakeBrowser for the test
    const id = 'some-runtime-id';
    fakeBrowser.runtime.id = id;
    console.log = mock.fn();

    // pass in fakeBrowser during tests
    logRuntimeId(fakeBrowser);

    assert.deepStrictEqual(console.log.mock.calls[0].arguments, [id]);
  });
});
```

:::

:::warning
Without mocking the `browser` variable, you'll see errors like this:

```
This script should only be loaded in a browser extension.
```

:::

WXT provides an in-memory, partial implementation of `browser`, [`fakeBrowser`](/api/wxt/testing/variables/fakeBrowser), from the [`@webext-core/fake-browser`](https://webext-core.aklinker1.io/guide/fake-browser/) package. `fakeBrowser` works with all testing frameworks/libraries. See their docs for a list of [implemented APIs](https://webext-core.aklinker1.io/guide/fake-browser/implemented-apis.html) and more example tests.

## E2E Tests

WXT does not provide any utils for running E2E tests. There are two libraries you can use to run E2E tests for any chrome extension.

- [`playwright`](https://playwright.dev/docs/chrome-extensions) (recommended) - "A high-level API to automate web browsers"
- [`puppeteer`](https://pptr.dev/guides/chrome-extensions) - "A high-level API to control headless Chrome over the DevTools Protocol"

:::info
Note that both only support running tests on Chrome.
:::

Before running tests with either of these tools, you must build the extension with `wxt build` and then load the extension from the output directory in a new tab.

To test an extension's UI, like the popup or options page, you'll need to know the extension's ID to open the URL directly.

> _chrome-extension://`browser.runtime.id`/popup.html_

- Playwright provides an API to get your extension ID after it has been installed. [See their docs](https://playwright.dev/docs/chrome-extensions#testing).
- Puppeteer requires you know the ID before installing the extension, so you can hard code it into the URLs you open. Follow [Chrome's guide](https://developer.chrome.com/docs/extensions/mv3/manifest/key/) to setup a consistent runtime id.

:::info
You cannot test popups in their normal popup window, you have to open them in a tab.
:::
