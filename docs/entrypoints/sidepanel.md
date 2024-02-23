# Side Panel

[Chrome Docs](https://developer.chrome.com/docs/extensions/reference/sidePanel/) &bull; [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Sidebars)

In Chrome, side panels use the "side_panel" API, while Firefox uses the "sidebar_action" API.

:::warning
Chrome added support for sidepanels in Manifest V3, they are not available in Manifest V2.
:::

## Filenames

<EntrypointPatterns
  :patterns="[
    ['sidepanel.html', 'sidepanel.html'],
    ['sidepanel/index.html', 'sidepanel.html'],
    ['<name>.sidepanel.html', '<name>.html` '],
    ['<name>.sidepanel/index.html', '<name>.html` '],
  ]"
/>

## Definition

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Default Side Panel Title</title>
    <meta
      name="manifest.default_icon"
      content="{
        16: '/icon-16.png',
        24: '/icon-24.png',
        ...
      }"
    />
    <meta name="manifest.open_at_install" content="true|false" />
    <meta name="manifest.browser_style" content="true|false" />
    <!-- Set include/exclude if the page should be removed from some builds -->
    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['chrome', ...]" />
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```
