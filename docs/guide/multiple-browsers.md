# Multiple Browsers

You can build an extension for any combination of browser and manifest version. Different browsers and manifest versions support different APIs and entrypoints, so be sure to check that your extension functions as expected for each target.

Separate build targets are written to their own output directories:

```
<rootDir>
└─ .output
   ├─ chrome-mv3
   ├─ firefox-mv2
   ├─ edge-mv3
   └─ ...
```

## Target Browser

To build for a specific browser, pass the `-b --browser` flag from the CLI:

```sh
wxt --browser firefox
wxt build --browser firefox
```

By default, it will build for `chrome`. When excluding the [manifest version flags](#target-manifest-version), it will default to the commonly accepted manifest version for that browser.

| Browser          | Default Manifest Version |
| ---------------- | :----------------------: |
| `chrome`         |            3             |
| `firefox`        |            2             |
| `safari`         |            2             |
| `edge`           |            3             |
| Any other string |            3             |

:::tip
To configure which browser is opened when running dev mode via `wxt -b <browser>`, see the [Development docs](/guide/development#configure-browser-startup) docs.
:::

## Target Manifest Version

To build for a specific manifest version, pass either the `--mv2` flag or `--mv3` flag from the CLI.

```sh
wxt --mv2
wxt build --mv2
```

When the `-b --browser` flag is not passed, it defaults to `chrome`. So here, we're targeting MV2 for Chrome.

## Customizing Entrypoints

There are several ways to customize entrypoint definitions per browser.

First, you can use either the `include` or `exclude` option to include or exclude the entrypoint from specific browsers. Here are some examples

:::code-group

```ts [Background]
export default defineBackground({
  // Only include a background script when targeting chrome
  include: ['chrome'],
});
```

```ts [Content Script]
export default defineContentScript({
  // Do not add this content script to the manifest when targeting firefox
  exclude: ['firefox'],
});
```

```html [HTML page]
<!-- entrypoints/options.html -->
<html>
  <head>
    <!-- Don't include the options page for safari -->
    <meta name="manifest.exclude" content="['safari']" />
  </head>
</html>
```

:::

Second, you can change individual options per-browser:

:::code-group

```ts [Background]
export default defineBackground({
  persistent: {
    // Use a non-persistent background script for just safari
    safari: false,
  },
});
```

```ts [Content Script]
export default defineContentScript({
  matches: {
    // Run the content script on different pages for each browser
    chrome: ['*://*.google.com/*'],
    firefox: ['*://*.duckduckgo.com/*'],
    edge: ['*://*.bing.com/*'],
  },
});
```

:::

:::warning
Only `defineBackground` and `defineContentScript` support per-browser options right now.
:::

## Runtime

To determine the browser or manifest version at runtime, you can use any of the below variables:

- `import.meta.env.BROWSER`: A string, the target browser, usually equal to the `--browser` flag
- `import.meta.env.MANIFEST_VERSION`: A number, either `2` or `3`, depending on the manifest version targeted
- `import.meta.env.CHROME`: A boolean equivalent to `import.meta.env.BROWSER === "chrome"`
- `import.meta.env.FIREFOX`: A boolean equivalent to `import.meta.env.BROWSER === "firefox"`
- `import.meta.env.EDGE`: A boolean equivalent to `import.meta.env.BROWSER === "edge"`
- `import.meta.env.SAFARI`: A boolean equivalent to `import.meta.env.BROWSER === "safari"`
- `import.meta.env.OPERA`: A boolean equivalent to `import.meta.env.BROWSER === "opera"`
- `import.meta.env.COMMAND`: A string, `"serve"` when running `wxt` for development or `"build"` in all other cases.

:::info
These variables are constants defined at build time based on the build target. They do not actually detect which browser the code is running in.

For example, if you build for `--browser chrome` and publish it on Edge, `import.meta.env.BROWSER` will be `"chrome"`, not `"edge"`. You have to build a separate ZIP for `--browser edge` before `import.meta.env.BROWSER` will be `"edge"`.

If you need to know the actual browser your code is being ran on, you should use a [user agent parser](https://www.npmjs.com/package/ua-parser-js).
:::
