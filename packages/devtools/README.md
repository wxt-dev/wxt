# WXT Devtools

## Installation

```sh
pnpm i -D @wxt-dev/devtools
```

Then add the module to your `wxt.config.ts` file:

```ts
export default defineConfig({
  modules: ['@wxt-dev/devtools'],
});
```

To open devtools, right-click anywhere, and choose "Open WXT Devtools"!

## Contributing

The actual devtools module is located in `modules/devtools/index.ts`. To test changes to the module, just run the `dev` script. This package contains a WXT extension with the devtools module included, so you can add any entrypoints as needed.

Note that when built and shipped as an NPM package, the UI is prebuilt so it can just be copied into the extension's output directory, so there's minimal slowdown during builds.
