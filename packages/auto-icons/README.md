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
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    // ...
  },
});
```

Options have JSDocs available in your editor, or you can read them in the source code: [`AutoIconsOptions`](https://github.com/wxt-dev/wxt/blob/main/packages/auto-icons/src/index.ts).

### Icon sizes

By default, the module generates icons at sizes `[128, 48, 32, 16]`.
Providing `sizes` replaces this list completely:

```ts
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    sizes: [16, 32, 48, 96, 128],
  },
});
```

Only the specified sizes are generated. Duplicate sizes are generated once.
Omitting `sizes` or setting it to `undefined` uses the defaults. Setting
`sizes: []` generates no icons and produces an empty `manifest.icons` object.

#### Migrating from additive sizes

Previously, custom sizes were appended to the default list. Custom sizes now
replace the defaults. To keep the previous output, include the default sizes
explicitly:

```ts
// Before: generated 96, 128, 48, 32, and 16.
autoIcons: {
  sizes: [96],
}

// After: explicitly include every size you need.
autoIcons: {
  sizes: [128, 48, 32, 16, 96],
}
```

Configurations that omit `sizes` keep the same default behavior.
