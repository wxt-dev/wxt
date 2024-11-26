# Assets

## `/assets` Directory

Any assets imported or referenced inside the `<srcDir>/assets/` directory will be processed by WXT's bundler.

Here's how you access them:

:::code-group

```ts [JS]
import imageUrl from '~/assets/image.png';

const img = document.createElement('img');
img.src = imageUrl;
```

```html [HTML]
<img src="~/assets/image.png" />
```

```css [CSS]
.bg-image {
  background-image: url(~/assets/image.png);
}
```

:::

## `/public` Directory

Files inside `<rootDir>/public/` are copied into the output folder as-is, without being processed by WXT's bundler.

Here's how you access them:

:::code-group

```ts [JS]
import imageUrl from '/image.png';

const img = document.createElement('img');
img.src = imageUrl;
```

```html [HTML]
<img src="/image.png" />
```

```css [CSS]
.bg-image {
  background-image: url(/image.png);
}
```

:::

## Inside Content Scripts

Assets inside content scripts are a little different. By default, when you import an asset, it returns just the path to the asset. This is because Vite assumes you're loading assets from the same hostname.

But, inside content scripts, the hostname is whatever the tab is set to. So if you try to fetch the asset, manually or as an `<img>`'s `src`, it will be loaded from the tab's website, not your extension.

To fix this, you need to convert the image to a full URL using `browser.runtime.getURL`:

```ts
// entrypoints/content.ts
import iconUrl from '/icon/128.png';

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main() {
    console.log(iconUrl); // "/icon/128.png"
    console.log(browser.runtime.getURL(iconUrl)); // "chrome-extension://<id>/icon/128.png"
  },
});
```

## WASM

:::warning 🚧 Under construction
These docs will be coming soon!
:::
