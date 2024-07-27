---
outline: deep
---

# Reusable Modules

## Overview

WXT provides a "module" API that lets you modify the build process. This API lets you add entrypoints, inject runtime code, add vite plugins, and more!

What's more, these modules can be shared on NPM and re-used between projects!

## Adding a Module

There are two ways to add a module to your project:

1. **Local file**: Any file present in the `modules/` directory will be treated as a module and loaded at build-time by WXT. You can use `modules/*.ts` or `modules/*/index.ts`, similar to entrypoints.

   ```ts
   // modules/example.ts
   import { defineWxtModule } from 'wxt/modules';

   export default defineWxtModule((wxt) => {
     // ...
   });
   ```

2. **NPM package**: Find WXT modules on NPM and include them in your project:
   ```ts
   // wxt.config.ts
   export default defineConfig({
     // Add the module to your project
     modules: ['@wxt-dev/auto-icons'],
   });
   ```

## Writing Modules

Modules contain a setup function that is executed at the beginning of the build process.

:::code-group

```ts [Function Definition]
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule((wxt) => {
  // ...
});
```

```ts [Object Definition]
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  // Add metadata...
  setup(wxt) {
    // ...
  },
});
```

:::

### Module Options

You can define custom options for your module by setting the `configKey`:

```ts
// modules/analytics.ts
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule<AnalyticsModuleOptions>({
  configKey: 'analytics',
  setup(wxt, options) {
    console.log(options); // { clientId: "..." }
  },
});

// Define the option types
export interface AnalyticsModuleOptions {
  clientId: string;
}

// Use "module augmentation" to add types for the new key
declare module 'wxt' {
  export interface InlineConfig {
    analytics: AnalyticsModuleOptions;
  }
}
```

Now, when the user provides options to the `analytics` key in their `wxt.config.ts`, those options are passed into the setup function as the second argument.

```ts
export default defineConfig({
  analytics: { clientId: '...' },
});
```

### Actually Doing Something

The first argument of the setup function, `wxt`, provides full access to the current build's context. You can access the resolved configuration via `wxt.config`, or setup hooks to manipulate the build at different steps of the build process with `wxt.hooks`.

Here's an example that updates the `outDir` based on the build mode. It's a very simple example of how to access config and setup a hook.

```ts
export default defineWxtModule((wxt) => {
  if (wxt.config.mode === 'development') {
    // Use the "ready" hook to update wxt.config
    wxt.hooks.hook('ready', (wxt) => {
      wxt.config.outDir = wxt.config.outDir.replace('.output', '.output/dev');
    });
  }
});
```

:::info Async Modules
Both the `setup` function and hook callbacks can be async. Don't forget to add `await`!
:::

It's important to understand the basics of how hooks work. Make sure to read the [API reference](/api/reference/wxt/interfaces/WxtHooks.html) for the full list of hooks and what they should be used for. They are the key to modifying your extension.

### Module Utils

Additionally, WXT provides several helper functions that setup hooks behind the scenes to streamline common operations.

For example, if you want to include an entrypoint from inside a module, you can use the `addEntrypoint` util:

```ts
// modules/changelog.ts
import { defineWxtModule, addEntrypoint } from 'wxt/modules';
import { resolve } from 'node:path';

export default defineWxtModule({
  name: 'changelog',
  setup(wxt) {
    addEntrypoint(wxt, {
      type: 'unlisted-page',
      name: 'changelog',
      // Point to the "modules/changelog.html" file
      inputPath: resolve(__dirname, 'changelog.html'),
      outputDir: wxt.config.outputDir,
      options: {},
    });
  },
});
```

Refer to the [API reference](/api/reference/wxt/modules/#functions) for the full list of the utilities.

## Plugins

Whereas modules are executed at build-time, plugins are executed at runtime. As of now, the only way to add a plugin is with the `addWxtPlugin` helper inside a module.

Here's a minimal example to execute something at runtime.

:::code-group

```ts [modules/example/index.ts]
import { defineWxtModule, addWxtPlugin } from 'wxt/modules';
import { resolve } from 'node:path';

export default defineWxtModule((wxt) => {
  addWxtPlugin(wxt, resolve(__dirname, 'plugin.ts'));
});
```

```ts [modules/example/plugin.ts]
import { defineWxtPlugin } from 'wxt/sandbox';

export default defineWxtPlugin(() => {
  console.log('Executing plugin!');
});
```

:::

:::warning Async Plugins
Unlike modules, **_plugins cannot be async_**!! If you need to do some async work and expose that result to the rest of the extension, store the result's promise synchronously and await it later on.
:::

## Publishing to NPM

:::warning 🚧 Under construction
These docs will be coming soon!
:::
