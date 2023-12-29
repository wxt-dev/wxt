# Unlisted Scripts

TypeScript files that are bundled and shipped with the extension, but are not included in the manifest.

You are responsible for loading/running these scripts where needed.

## Filenames

<EntrypointPatterns
  :patterns="[
    ['<name>.[jt]sx?', '<name>.js'],
    ['<name>/index.[jt]sx?', '<name>.js'],
  ]"
/>

## Definition

```ts
export default defineUnlistedScript(() => {
  // Executed when script is loaded
});
```

or

```ts
export default defineUnlistedScript({
  // Set include/exclude if the script should be removed from some builds
  include: undefined | string[],
  exclude: undefined | string[],

  // Executed when script is loaded
  main() {
    // ...
  },
});
```
