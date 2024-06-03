# `<srcDir>/assets`

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
    <img src="~/assets/illustration.svg" />
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
