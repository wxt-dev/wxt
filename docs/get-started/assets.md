# Assets

WXT has two directories for storing assets like CSS, images, or fonts.

- `<srcDir>/public`: Store files that will be copied into the output directory as-is
- `<srcDir>/assets`: Store files that will be processed by Vite during the build process

## `/public` Directory

Place static files like the extension icon or `_locales/` directory here. These files will be copied over to the output directory without being transformed by Vite.

```
<srcDir>
└─ public/
   ├─ icon-16.png
   ├─ icon-32.png
   ├─ icon-48.png
   ├─ icon-96.png
   └─ icon-128.png
```

### Example

You can reference these files by using absolute paths in HTML files or `browser.runtime.getURL` in content scripts.

:::code-group

```html [popup.html]
<img src="/icon-128.png" />
```

```ts [content.ts]
defineContentScript({
  main() {
    const image = document.createElement('img');
    image.src = browser.runtime.getURL('/icon-128.png');
    document.body.append(image);
  },
});
```

:::

## `/assets` Directory

Files in the assets directory will be processed by Vite. They are imported in your source code, and will be transformed or renamed in the output directory.

```
<srcDir>
└─ assets/
   ├─ style.css
   └─ illustration.svg
```

### Example

:::code-group

```html [popup.html]
<html>
  <head>
    <link rel="stylesheet" href="~/assets/style.css" />
    <!-- ... -->
  </head>
  <body>
    <img src="~/illustration.svg" />
    <!-- ... -->
  </body>
</html>
```

```ts [content.ts]
import '~/assets/style.css';
import illustration from '~/assets/style.svg';

defineContentScript({
  main() {
    const image = document.createElement('img');
    image.src = illustration;
    document.body.append(image);
  },
});
```

:::
