# WXT UnoCSS

Use UnoCSS in your WXT extension!

## Usage

Install the package:

```sh
npm i --save-dev @wxt-dev/unocss unocss
pnpm i -D @wxt-dev/unocss unocss
yarn add --dev @wxt-dev/unocss unocss
bun i -D @wxt-dev/unocss unocss
```

Add the module to `wxt.config.ts`:

```ts
export default defineConfig({
  modules: ['@wxt-dev/unocss'],
});
```

Now in your entrypoint, import UnoCSS:

```ts
import 'virtual:uno.css';
```

> [!IMPORTANT]
> While in dev mode, you may see a warning about `uno.css` not being found. This is because in development, we don't know which files should be injected with UnoCSS styles. The warning can be safely ignored as the styles will be properly applied during the build process.

## Configuration

The module can be configured via the `unocss` config:

```ts
export default defineConfig({
  modules: ['@wxt-dev/unocss'],
  unocss: {
    // Exclude unocss from running for the background
    excludeEntrypoints: ['background'],
  },
});
```

Options have JSDocs available in your editor, or you can read them in the source code: [`UnoCSSOptions`](https://github.com/wxt-dev/wxt/blob/main/packages/unocss/src/index.ts).
