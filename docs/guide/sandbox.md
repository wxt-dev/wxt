# Sandbox

[Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/manifest/sandbox/)

:::tip Chromium Only
Firefox does not support sandboxed pages.
:::

## Filenames

<EntrypointPatterns
  :patterns="[
    ['entrypoints/sandbox.html', 'sandbox.html'],
    ['entrypoints/sandbox/index.html', 'sandbox.html'],
    ['entrypoints/<name>.sandbox.html', '<name>.html` '],
    ['entrypoints/<name>.sandbox/index.html', '<name>.html` '],
  ]"
/>

## Definition

Plain old HTML file.

```html
<!DOCTYPE html>
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
