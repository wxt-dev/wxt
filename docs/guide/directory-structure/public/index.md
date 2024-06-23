# `public/`

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
