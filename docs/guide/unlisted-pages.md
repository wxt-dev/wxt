# Unlisted Pages

HTML pages that are built by Vite, but are not included in the manifest.

### Examples

- Onboarding
- Dashboard
- FAQ
- Help
- Changelog

## Filenames

- `entrypoints/<name>.html`
- `entrypoints/<name>/index.html`

Pages are accessible at `'/<name>.html'`:

```ts
const url = browser.runtime.getURL('/<name>.html');

console.log(url); // "chrome-extension://<id>/<name>.html"
```

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
