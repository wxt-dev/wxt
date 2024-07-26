# WXT Auto Icons

## Features

- Generate extension icons with the correct sizes
- Make the icon greyscale during development

## Usage

Install the package:

```sh
npm i --save-dev @wxt-dev/auto-icons
pnpm i -D @wxt-dev/auto-icons
yarn add --dev @wxt-dev/auto-icons
bun i -D @wxt-dev/auto-icons
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
export default defineConfig({
  module: ['@wxt-dev/auto-icons'],
  autoIcons: {
    // ...
  },
});
```

Options have JSDocs available in your editor, or you can read them in the source code: [`AutoIconsOptions`](./src/index.ts).
