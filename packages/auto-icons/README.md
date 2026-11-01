# WXT Auto Icons

[Changelog](https://github.com/wxt-dev/wxt/blob/main/packages/auto-icons/CHANGELOG.md)

## Features

- Generate extension icons with the correct sizes
- Make the icon greyscale or include a visible overlay during development
- SVG is supported

## Usage

Install the package:

```sh
npm i --save-dev @wxt-dev/auto-icons
pnpm i -D @wxt-dev/auto-icons
yarn add --dev @wxt-dev/auto-icons
bun add -D @wxt-dev/auto-icons
```

Add the module to `wxt.config.ts`:

```ts
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
});
```

And finally, save the base icon to `<srcDir>/assets/icon.png`.

## Configuration

The module can be configured via the `autoIcons` config:

```ts
import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    // See AutoIconsOptions API documentation:
    // https://npmx.dev/package-docs/@wxt-dev/auto-icons/v/latest#interface-AutoIconsOptions

    // Use an absolute path to reference an icon outside srcDir.
    baseIconPath: resolve('public/icon.svg'),
  },
});
```

Options have JSDocs available in your editor, or you can read them in the source code: [`AutoIconsOptions`](https://github.com/wxt-dev/wxt/blob/main/packages/auto-icons/src/index.ts).
