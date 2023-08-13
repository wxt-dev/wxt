# Options

[Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/options/) &bull; [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/options_ui)

## Filenames

<EntrypointPatterns
  :patterns="[
    ['options.html', 'options.html'],
    ['options/index.html', 'options.html'],
  ]"
/>

## Definition

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Options Title</title>
    <meta name="manifest.open_in_tab" content="true|false" />
    <meta name="manifest.chrome_style" content="true|false" />
    <meta name="manifest.browser_style" content="true|false" />
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

> All manifest options default to `undefined` when the `meta` tag is not present.
