# Unlisted Scripts

TypeScript files that are built, but are not included in the manifest.

## Filenames

<EntrypointPatterns
  :patterns="[
    ['<name>.tsx?', '<name>.js'],
    ['<name>/index.tsx?', '<name>.js'],
  ]"
/>

## Definition

Unlike the background or content scripts, you can define this script's logic in the top level scope.

```ts
// Code goes here
```
