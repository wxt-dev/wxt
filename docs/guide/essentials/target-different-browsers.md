# Targeting Different Browsers

When building an extension with WXT, you can create multiple builds of your extension targeting different browsers and manifest versions.

## Target a Browser

Use the `-b` CLI flag to create a separate build of your extension for a specific browser. By default, `chrome` is targeted.

```sh
wxt            # same as: wxt -b chrome
wxt -b firefox
wxt -b custom
```

During development, if you target Firefox, Firefox will open. All other strings open Chrome by default. To customize which browsers open, see [Set Browser Binaries](/guide/essentials/config/browser-startup#set-browser-binaries).

Additionally, WXT defines several constants you can use at runtime to detect which browser is in use:

```ts
if (import.meta.env.BROWSER === 'firefox') {
  console.log('Do something only in Firefox builds');
}
if (import.meta.env.FIREFOX) {
  // Shorthand, equivalent to the if-statement above
}
```

Read about [Built-in Environment Variables](/guide/essentials/config/environment-variables.html#built-in-environment-variables) for more details.

## Map Custom Browsers

WXT knows how a handful of labels behave: `chrome`, `edge`, `brave`, `opera` and `chromium` generate Chromium code, `firefox` generates Firefox code, and `safari` and `ios` generate Safari code.

When you build with a custom label, WXT falls back to Chromium, since it has no way to know what that label runs in. Use `targetBrowserMap` to tell it:

```ts
export default defineConfig({
  targetBrowserMap: {
    waterfox: 'firefox',
  },
});
```

Now `wxt -b waterfox` generates the same manifest, and the same default manifest version, as `wxt -b firefox`. The build still outputs to `.output/waterfox-mv2`, and `import.meta.env.BROWSER` still reports `"waterfox"`, so output paths and runtime checks keep the label you built with.

## Target a Manifest Version

To target specific manifest versions, use the `--mv2` or `--mv3` CLI flags.

:::tip Default Manifest Version
By default, WXT will target MV2 for Safari and Firefox, including custom labels mapped to them, and MV3 for all other browsers.
:::

Similar to the browser, you can get the target manifest version at runtime using the [built-in environment variable](/guide/essentials/config/environment-variables.html#built-in-environment-variables):

```ts
if (import.meta.env.MANIFEST_VERSION === 2) {
  console.log('Do something only in MV2 builds');
}
```

## Filtering Entrypoints

Every entrypoint can be included or excluded when targeting specific browsers via the `include` and `exclude` options.

Here are some examples:

- Content script only built when targeting `firefox`:

  ```ts
  export default defineContentScript({
    include: ['firefox'],

    main(ctx) {
      // ...
    },
  });
  ```

- HTML file only built for all targets other than `chrome`:

  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="manifest.exclude" content="['chrome', ...]" />
    </head>
    <body>
      <!-- ... -->
    </body>
  </html>
  ```

Alternatively, you can use the [`filterEntrypoints` config](/api/reference/wxt/interfaces/InlineConfig#filterentrypoints) to list all the entrypoints you want to build.

## Per-Browser Options

Some entrypoint options can be customized per build target by passing an object keyed by the [target browser](/guide/essentials/target-different-browsers#target-a-browser) instead of a single value. This is useful when different browsers need different match patterns, run timings, or other entrypoint behavior:

```ts
export default defineContentScript({
  matches: {
    chrome: ['*://chrome.example.com/*'],
    firefox: ['*://firefox.example.com/*'],
  },
  runAt: {
    chrome: 'document_start',
    firefox: 'document_end',
  },

  world: {
    firefox: 'MAIN',
  },

  main(ctx) {
    // ...
  },
});
```
