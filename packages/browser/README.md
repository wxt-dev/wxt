# `@wxt-dev/browser`

Provides access to the `browser` or `chrome` extension APIs and related types.

```ts
import { browser, Browser } from '@wxt-dev/browser';
// Or if you're using WXT:
// import { browser, Browser } from 'wxt/browser';

console.log(browser.runtime.id);

const onMessage = (message: any, sender: Browser.runtime.MessageSender) => {
  console.log(message);
};
browser.runtime.onMessage.addListener(onMessage);
```

## Installation

If you're using WXT, this package is already installed, you don't need to install it manually.

Otherwise, you can install the package from NPM:

```sh
pnpm install @wxt-dev/browser
```

## Upgrading to Latest Types

Just run:

```sh
pnpm upgrade @wxt-dev/browser
```

This should update both the manually installed version and the subdependency inside WXT.

## Contributing

### Code Generation

Types are generated based on the `@types/chrome` package, and with modifications specifically for use with WXT.

### Updating `@types/chrome` Version

You don't need to do anything! [A github action](https://github.com/wxt-dev/wxt/actions/workflows/update-browser-package.yml) is ran every day to generate and publish this package using the latest `@types/chrome` version.

You can manually generate types via:

```sh
pnpm gen
```

### Why not just use `@types/chrome`?

With WXT, you must import the `browser` variable to use the extension APIs. The way `@types/chrome` is implemented forces you to define a global `chrome` variable. With WXT, this isn't acceptable, we don't want to pollute the global (type) scope or introduce conflicts with auto-imports.

Additionally, WXT overrides types to provide additional type safety for some APIs, like `browser.runtime.getURL` and `browser.i18n.getMessage`. With `@types/chrome`'s nested namespace approach, it's not possible to override the types for those functions.
