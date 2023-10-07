# Multiple Browsers

You can build an extension for any combination of browser and manifest verison. Different browsers and manifest versions support different APIs and entrypoints, so be sure to check that your extension functions as expected for each target.

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

```

wxt --browser firefox
wxt build --browser firefox

```

By default, it will build for `chrome`. When excluding the [`--mv2` or `--mv3` flags](#target-manifest-version), it will default to the commonly accepted manifest version used with that browser.

| Browser          | Default Manifest Version |
| ---------------- | :----------------------: |
| `chrome`         |            3             |
| `firefox`        |            2             |
| `safari`         |            2             |
| `edge`           |            3             |
| Any other string |            3             |

## Target Manifest Version

To build for a specific manifest version, pass either the `--mv2` flag or `--mv3` flag from the CLI.

```sh
wxt --mv2
wxt build --mv2
```

When the `-b --browser` flag is not passed, it defaults to `chrome`. So here, we're targetting MV2 for Chrome.

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
