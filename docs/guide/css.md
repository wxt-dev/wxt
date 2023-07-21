# CSS

WXT can build CSS entrypoints individually. CSS entrypoints are always unlisted.

See [Content Script CSS](/guide/content-scripts.md#css) documentation for the recomended approach to include CSS with a content script.

:::info
If the recommended approach doesn't work for your use case, you can use any of the filename patterns below to build the styles separate from the JS and use the [`transformManifest` hook](/config.md#transformmanifest) to manually add your CSS file to the manifest.
:::

## Filenames

When a filename matches the pattern below, WXT will transform it and output it with the rest of your extension.

- `entrypoints/content.(css|scss|sass|less|styl|stylus)`
- `entrypoints/<name>.(css|scss|sass|less|styl|stylus)`
- `entrypoints/<name>/index.(css|scss|sass|less|styl|stylus)`
- `entrypoints/<name>.content.(css|scss|sass|less|styl|stylus)`
- `entrypoints/<name>.content/index.(css|scss|sass|less|styl|stylus)`

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
