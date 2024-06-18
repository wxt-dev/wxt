# `@wxt-dev/devtools`

## Features

- [ ] Logs all in a single place

Aaaannnddd... that's it for now lol.

## Usage

```sh
pnpm i -D @wxt-dev/devtools
```

Then add the module to your config:

```ts
// wxt.config.ts
export default defineConfig({
  // Required
  modules: ['@wxt-dev/devtools'],

  // Optional: Pass options to the module:
  devtools: {
    // ...
  },
});
```

## Development

You can manually test changes to the devtools in `packages/wxt-demo`. Just run the dev command, and it will rebuild this package and include your latest changes in the demo extension:

```sh
cd packages/wxt-demo
pnpm dev
```

There are 3 parts of this module:

1. `src/index.ts`: The module itself, the where everything is setup
2. `src/plugin.ts`: The plugin code that is executed at runtime.
3. `src/devtools.html`: The devtool UI page that can be opened when running your extension in dev mode.

These 3 parts are build in two steps inside `build.config.ts`

1. Build `src/index.ts` and `src/plugin.ts` with `unbuild` into `dist`
2. Bundle `src/devtools.html` an it's related JS files `dist/prebuilt`
