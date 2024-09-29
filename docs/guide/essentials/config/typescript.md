# TypeScript Configuration

When you run [`wxt prepare`](/api/cli/wxt-prepare), WXT generates a base TSConfig file for your project at `<rootDir>/.wxt/tsconfig.json`.

At a minimum, you need to create a TSConfig in your root directory that looks like this:

```jsonc
// <rootDir>/tsconfig.json
{
  "extends": ".wxt/tsconfig.json",
}
```

Or if you're in a monorepo, you may not want to extend the config. If you don't extend it, you need to add `.wxt/wxt.d.ts` to the TypeScript project:

```ts
/// <reference types="./.wxt/wxt.d.ts" />
```

Additionally, if you need to specify custom compiler options, you should add them in `<rootDir>/tsconfig.json`, NOT `<rootDir>/.wxt/tsconfig.json`.

```jsonc
// <rootDir>/tsconfig.json
{
  "extends": ".wxt/tsconfig.json",
  "compilerOptions": {
    "jsx": "perserve",
  },
}
```

## TSConfig Paths

`<rootDir>/.wxt/tsconfig.json` includes a default set of path aliases. To add your own, DO NOT add them to either `tsconfig.json` by hand.

Instead, use the [`alias` config](/api/reference/wxt/interfaces/InlineConfig#alias) in `wxt.config.ts`. This will add your custom aliases to the generated `<rootDir>/.wxt/tsconfig.json` file next time you run `wxt prepare`.

```ts
import { resolve } from 'node:path';

export default defineConfig({
  alias: {
    testing: resolve('utils/testing'),
  },
});
```
