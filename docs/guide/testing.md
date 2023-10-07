# Testing

WXT provides a couple of utils for unit testing your extension.

[[toc]]

## Fake Browser

The `wxt/fake-browser` package includes an in-memory implementation of the `browser` variable you can use for testing. WXT simply re-exports the `fakeBrowser` variable from [`@webext-core/fake-browser`](https://webext-core.aklinker1.io/guide/fake-browser/).

Here's an example test using Vitest:

```ts
import { describe, it, expect, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt';

// Function we're testing
function onHelloMessage(cb: () => void) {
  browser.runtime.onMessage.addEventListener((message) => {
    if (message.type === 'hello') return 'world';
  });
}

// Mock the real `browser` object with a fake one
vi.mock('wxt/browser', () => import('wxt/fake-browser'));

describe('onHelloMessage', () => {
  it("should call the callback when the message type is 'hello'", () => {
    const cb = vi.fn();
    const expected = 'world';

    onHelloMessage(cb);
    const actual = await fakeBrowser.runtime.sendMessage({ type: 'hello' });

    expect(cb).toBeCalledTimes(1);
    expect(actual).toBe(expected);
  });

  it("should ignore the message when the message type is not 'hello'", () => {
    const cb = vi.fn();

    onHelloMessage(cb);
    await fakeBrowser.runtime.sendMessage({ type: 'not-hello' }).catch();

    expect(cb).not.toBeCalled();
  });
});
```

See [`@webext-core/fake-browser`](https://webext-core.aklinker1.io/guide/fake-browser/) for setup, implemented APIs, and example tests.

## Handling Auto-imports

By default, WXT uses auto-imports. For tests, this can cause issues if your test environment is not setup to handle them correctly.

:::warning 🚧&ensp;Testing utils are not implemented yet!
Eventually, WXT will provide utilities for setting up these auto-imports. For now, you'll need to set them up manually.
:::

Not all testing frameworks can handle auto-imports. If your framework or setup is not listed below, it may be easiest to disable auto-imports.

To setup auto-imports manually, use [`unplugin-auto-import`](https://www.npmjs.com/package/unplugin-auto-import). It uses the same tool, `unimport`, as WXT and will result in compatiple auto-imports. `unplugin-auto-import` supports lots of different tools (vite, webpack, esbuild, rollup, etc). You can try and integrate it into your build process.

### Vitest (Recommended)

Vitest is easy, simply add `uplugin-auto-import` to your project.

```ts
// vitest.config.ts
import autoImports from 'unplugin-auto-import/vite';

export default defineConfig({
  plugins: [
    autoImports({
      imports: [{ name: 'defineConfig', from: 'wxt' }],
      presets: [{ package: 'wxt/client' }, { package: 'wxt/browser' }],
      dirs: ['components', 'composables', 'hooks', 'utils'],
    }),
  ],
});
```

### Jest

Don't use jest and auto-imports. You could try and configure jest to be transpiled by one of `unplugin-auto-import`'s supported built tools, but I don't know of a way to configure this. See [unplugin/unplugin-auto-import#33](https://github.com/unplugin/unplugin-auto-import/issues/33) if you want to try and set it up.

I would recommend disabling auto-imports or migrating to Vitest if you want to use auto-imports.

### Mocha

TODO: Is this possible? Maybe with `esbuild-mocha`? I would recommend moving to Vitest.
