# Unlisted Pages

HTML pages that are bundled and shipped with the extension, but are not included in the manifest.

If you plan on using the page in an iframe, don't forget to add the page to [`web_accessible_resources`](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources).

### Examples

- Onboarding
- Dashboard
- FAQ
- Help
- Changelog

## Filenames

<EntrypointPatterns
  :patterns="[
    ['<name>.html', '<name>.html'],
    ['<name>/index.html', '<name>.html'],
  ]"
/>

Pages are accessible at `'/<name>.html'`:

```ts
const url = browser.runtime.getURL('/<name>.html', '<html></html>');

console.log(url); // "chrome-extension://<id>/<name>.html"
```

## Definition

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Title</title>
    <!-- Set include/exclude if the page should be removed from some builds -->
    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['chrome', ...]" />
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```
