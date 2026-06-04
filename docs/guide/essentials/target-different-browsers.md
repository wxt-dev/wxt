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

## Target a Manifest Version

To target specific manifest versions, use the `--mv2` or `--mv3` CLI flags.

:::tip Default Manifest Version
By default, WXT will target MV2 for Safari and Firefox and MV3 for all other browsers.
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

Many entrypoint config options accept either a single value (applied to every browser build) or a per-browser map (a different value per build target). These are typed as `PerBrowserOption<T>` in the WXT source:

```ts
export type PerBrowserOption<T> = T | PerBrowserMap<T>;
export type PerBrowserMap<T> = { [browser: TargetBrowser]: T };
```

This applies to fields like `matches`, `runAt`, `matchAboutBlank`, `excludeMatches`, `includeGlobs`, `excludeGlobs`, `allFrames`, `matchOriginAsFallback`, `cssInjectionMode`, `registration`, `defaultTitle`, `defaultArea`, `persistent`, and several others on `BackgroundEntrypointOptions`, `BaseContentScriptEntrypointOptions`, `PopupEntrypointOptions`, `OptionsEntrypointOptions`, and `SidepanelEntrypointOptions`.

### Apply the same value to every build

Pass the value directly:

```ts
export default defineContentScript({
  matches: ['*://*.example.com/*'],
  runAt: 'document_idle',
  // ...
});
```

### Use a different value per browser

Pass a `PerBrowserMap` keyed by the [build target](/guide/essentials/target-different-browsers#target-a-browser) (`chrome`, `firefox`, `safari`, `edge`, `opera`, `custom`, or a custom target from `webExt.config.browserTargets`):

```ts
export default defineContentScript({
  matches: {
    chrome: ['*://*.example.com/*'],
    firefox: ['*://*.example.org/*'],
  },
  runAt: {
    chrome: 'document_start',
    firefox: 'document_idle',
  },
  // ...
});
```

If a build target is omitted from the map, that build inherits the build's default for that field (typically the same as if you didn't set the option at all). For example, the `safari` build above would fall back to WXT's default `runAt`.

:::tip Mixed forms
You can mix both styles inside the same entrypoint — some fields can be plain values and others maps — as long as each individual field is either a `T` or a `PerBrowserMap<T>`.
:::

For the manifest-level `default_icon` (a nested `Record<resolution, iconPath>` that doesn't fit the per-key shape), see [Manifest config](/guide/essentials/config/manifest) for the manual per-browser workaround.
