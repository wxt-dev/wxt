# CSS

WXT can build CSS entrypoints individually.

While you could build CSS for content scripts using separate entrypoints, this is not the recommended approach to include CSS in a content script. Instead, see [Content Script CSS](/guide/content-scripts.md#css) documentation.

If the recommended approach doesn't work for your use case, you can use any of the filename patterns above to build the CSS separate from the JS, then use the [`transformManifest` hook](/config.md#transformmanifest) to manually add your CSS file to the manifest.

## Filenames

When a filename matches the pattern below, WXT will transform it and output it with the rest of your extension.

- `entrypoints/content.(css|scss|sass|less|styl|stylus)`
- `entrypoints/*.(css|scss|sass|less|styl|stylus)`
- `entrypoints/*/index.(css|scss|sass|less|styl|stylus)`
- `entrypoints/*.content.(css|scss|sass|less|styl|stylus)`
- `entrypoints/*.content/index.(css|scss|sass|less|styl|stylus)`

## Definition

```css
body {
  /* Plain CSS file */
}
```

Follow Vite's guide to setup a preprocessor: https://vitejs.dev/guide/features.html#css-pre-processors

```sh
pnpm i sass
```

```scss
body {
  h1 {
    /* ...*/
  }
}
```
