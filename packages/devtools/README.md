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

### Browser APIs

Instead of using `wxt/browser`, this plugin uses the `chrome` global. This is because the polyfill can't be loaded into sandboxed pages/scripts. This means there's a bit more work to make sure the devtools work on all browsers, but this is less of a task than isolating the sandbox.
