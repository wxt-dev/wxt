# Newtab

[Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/override/) &bull; [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/chrome_url_overrides)

## Filenames

<EntrypointPatterns
  :patterns="[
    ['newtab.html', 'newtab.html'],
    ['newtab/index.html', 'newtab.html'],
  ]"
/>

## Definition

Plain old HTML file.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Title</title>
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```
