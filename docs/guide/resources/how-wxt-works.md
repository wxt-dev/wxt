# How WXT Works

Think of WXT as a "bundler orchastrator". All it does is tell a bundler, Vite, what to build and how to build it.

WXT can be broken into two parts:

1. Building for production
2. Dev mode/server

Since building for production is much simpler, we'll start there!

## Building for Production

Lets say you have a web extension with a popup, options page, content script, and background. An extension like this is actually really easy to build with Vite:

1. Build the HTML pages (popup and options) with code splitting enabled
2. Build the background as an IIFE with code splitting disabled
3. Build content script as an IIFE with code splitting disabled

```ts
import * as vite from 'vite';

await vite.build({
  build: {
    rollupOptions: {
      input: {
        popup: 'entrypoints/popup.html',
        options: 'entrypoints/options.html',
      },
    },
  },
});
await vite.build({
  build: {
    lib: {
      entry: 'entrypoints/background.ts',
      formats: ['iife'],
    },
  },
});
await vite.build({
  build: {
    lib: {
      entry: 'entrypoints/content.ts',
      formats: ['iife'],
    },
  },
});
```

This will build an extension that works on all browsers and manifest versions. For MV3, there are optimizations you could make around the background, but hopefully this illustrates the basic process - just build things with Vite!

And... that's honestly it for building for production. There are other various things WXT does but it all boils down to grouping entrypoints into groups that can be built in a single Vite build, then building all those groups.

So why use WXT? That seems really simple...

Because dev mode is much more complex.

## Dev Mode

The main requirement of loading an unpacked extension is that all files listed in the manifest must be present in the extension's directory when the extension is loaded.

That means the first thing WXT has to do is write all the required files to disk. Obviously, the easiest way to do this is with a production build... but we don't want to do that! If we do a full build, dev startup times will be super slow.

Instead, we minimize the amount of code we have to build by pointing script and asset URLs to the dev server instead of bundling them into the output. That way, when Vite bundles the URLs, it skips over any links to the dev server, and we can write the HTML files to the disk quickly.

For the background, we have to do the full build before the extension can be loaded - no exception.

But for content scripts, we can actually use the `scripting` APIs to register them dynamically. That means they don't have to be present on the disk when the extension is installed/reloaded. We can build them after opening the browser and ensuring that the scripts are injected locally.

So that means dev mode is split into two different behaviors/set ups:

1. Scripts and other standalone scripts/assets are rebuilt when a file they depend on is saved
2. HTML pages take advantage of Vite's dev server and HMR, meaning WXT doesn't have to rebuild the entire entry from scratch

Scripts and assets like CSS are built during development the same way they are in production: `vite.build`. Just add a file watcher and you're good to go.

Now comes the hard part: HTML pages.

WXT uses the same Vite server for development, however HTML pages in web extensions are not normal webpages. Most of the transformations Vite applies do not work for web extension pages.

The main issue is that an extension's HTML page must be present in the directory the extension is loaded from. In fact, all entrypoints listed on the manifest must be written to the file system for an extension to be loaded initially.
