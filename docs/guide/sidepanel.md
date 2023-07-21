# Side Panel

[Chrome Docs](https://developer.chrome.com/docs/extensions/reference/sidePanel/)

:::tip Chromium Only
Firefox does not support sandboxed pages.
:::

## Filenames

<EntrypointPatterns
  :patterns="[
    ['entrypoints/sidepanel.html', 'sidepanel.html'],
    ['entrypoints/sidepanel/index.html', 'sidepanel.html'],
    ['entrypoints/<name>.sidepanel.html', '<name>.html` '],
    ['entrypoints/<name>.sidepanel/index.html', '<name>.html` '],
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
