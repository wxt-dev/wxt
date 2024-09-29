# Hooks

WXT includes an in-depth system that let's you hook into the build process and make changes.

Here's an example hook that modifies the `manifest.json` file before it is written to the output directory:

```ts
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.mode === 'development') {
        manifest.title += ' (DEV)';
      }
    },
  },
});
```

> Most hooks provide the `wxt` object as the first argument. If contains the resolved config and other info about the current build.

Putting one-off hooks like this in your config file is simple, but if you find yourself writing lots of hooks, you should extract them into [WXT Modules](/guide/essentials/wxt-modules) instead.
