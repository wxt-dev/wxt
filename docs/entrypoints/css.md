# CSS

WXT can build CSS entrypoints individually. CSS entrypoints are always unlisted.

See [Content Script CSS](/entrypoints/content-scripts#css) documentation for the recomended approach to include CSS with a content script.

:::info
If the recommended approach doesn't work for your use case, you can use any of the filename patterns below to build the styles separate from the JS and use the [`transformManifest` hook](/api/wxt/interfaces/InlineConfig#transformmanifest) to manually add your CSS file to the manifest.
:::

## Filenames

<EntrypointPatterns
  :patterns="[
    ['<name>.(css|scss|sass|less|styl|stylus)', '<name>.css'],
    ['<name>/index.(css|scss|sass|less|styl|stylus)', '<name>.css'],
    ['content.(css|scss|sass|less|styl|stylus)', 'content-scripts/content.css'],
    ['content/index.(css|scss|sass|less|styl|stylus)', 'content-scripts/content.css'],
    ['<name>.content.(css|scss|sass|less|styl|stylus)', 'content-scripts/<name>.css'],
    ['<name>.content/index.(css|scss|sass|less|styl|stylus)', 'content-scripts/<name>.css'],
  ]"
/>

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
