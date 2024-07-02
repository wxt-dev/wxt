<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: My Module
- Package name: my-module
- Description: My new WXT module
- GitHub Username: your-org
- Config key: myModule
- Types: MyModule
-->

# My Module

My new WXT module for doing amazing things.

## Features

<!-- Highlight some of the features your module provide here -->

- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Installation

Install the module to your WXT extension with one command:

```bash
pnpm i my-module
```

Then add the module to your `wxt.config.ts` file:

```ts
export default defineConfig({
  modules: ['my-module'],
});
```

That's it! You can now use My Module in your WXT extension ✨

## Contribution

<details>
  <summary>Local development</summary>

```bash
# Install dependencies
pnpm install

# Generate type stubs
pnpm wxt prepare

# Develop test extension
pnpm dev

# Build the test extension
pnpm dev:build

# Run prettier, publint, and type checks
pnpm check
```

</details>
