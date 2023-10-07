# Unlisted Scripts

TypeScript files that are built, but are not included in the manifest.

## Filenames

<EntrypointPatterns
  :patterns="[
    ['<name>.[jt]sx?', '<name>.js'],
    ['<name>/index.[jt]sx?', '<name>.js'],
  ]"
/>

## Definition

Unlike the background or content scripts, you can define this script's logic in the top level scope.

```ts
// Code goes here
```
