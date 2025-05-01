---
outline: deep
---

# Upgrading WXT

## Overview

To upgrade WXT to the latest major version:

1. Install it, skipping scripts so `wxt prepare` doesn't run - it will probably throw an error after a major version change (we'll run it later).
   ```sh
   pnpm i wxt@latest --ignore-scripts
   ```
2. Follow the upgrade steps below to fix any breaking changes.
3. Run `wxt prepare`. It should succeed and type errors will go away afterwords.
   ```sh
   pnpm wxt prepare
   ```
4. Manually test to make sure both dev mode and production builds work.

For minor or patch version updates, there are no special steps. Just update it with your package manager:

```sh
pnpm i wxt@latest
```

---

Listed below are all the breaking changes you should address when upgrading to a new version of WXT.

Currently, WXT is in pre-release. This means changes to the second digit, `v0.X`, are considered major and have breaking changes. Once v1 is released, only major version bumps will have breaking changes.

## v0.19.0 &rarr; v0.20.0

v0.20 is a big release! There are lots of breaking changes because this version is intended to be a release candidate for v1.0. If all goes well, v1.0 will be released with no additional breaking changes.

:::tip
Read through all the changes once before updating your code.
:::

### `webextension-polyfill` Removed

WXT's `browser` no longer uses the `webextension-polyfill`!

:::details Why?
See https://github.com/wxt-dev/wxt/issues/784
:::

To upgrade, you have two options:

1. **Stop using the polyfill**
   - If you're already using `extensionApi: "chrome"`, then you're not using the polyfill and there is nothing to change!
   - Otherwise there is only one change: `browser.runtime.onMessage` no longer supports using promises to return a response:
      ```ts
      browser.runtime.onMessage.addListener(async () => { // [!code --]
      browser.runtime.onMessage.addListener(async (_message, _sender, sendResponse) => { // [!code ++]
        const res = await someAsyncWork(); // [!code --]
        return res; // [!code --]
        someAsyncWork().then((res) => { // [!code ++]
          sendResponse(res); // [!code ++]
        }); // [!code ++]
        return true; // [!code ++]
      });
      ```
2. **Continue using the polyfill** - If you want to keep using the polyfill, you can! One less thing to worry about during this upgrade.
   - Install `webextension-polyfill` and WXT's [new polyfill module](https://www.npmjs.com/package/@wxt-dev/webextension-polyfill):
     ```sh
     pnpm i webextension-polyfill @wxt-dev/webextension-polyfill
     ```
   - Add the WXT module to your config:
     ```ts [wxt.config.ts]
     export default defineConfig({
       modules: ['@wxt-dev/webextension-polyfill'],
     });
     ```

The new `browser` object (and types) is backed by WXT's new package: [`@wxt-dev/browser`](https://www.npmjs.com/package/@wxt-dev/browser). This package continues WXT's mission of providing useful packages for the whole community. Just like [`@wxt-dev/storage`](https://www.npmjs.com/package/@wxt-dev/storage), [`@wxt-dev/i18n`](https://www.npmjs.com/package/@wxt-dev/i18n), [`@wxt-dev/analytics`](https://www.npmjs.com/package/@wxt-dev/analytics), it is designed to be easy to use in any web extension project, not just those using WXT, and provides a consistent API across all browsers and manifest versions.

### `extensionApi` Config Removed

The `extensionApi` config has been removed. Before, this config provided a way to opt into using the new `browser` object prior to v0.20.0.

Remove it from your `wxt.config.ts` file if present:

```ts [wxt.config.ts]
export default defineConfig({
  extensionApi: 'chrome', // [!code --]
});
```

### Extension API Type Changes

With the new `browser` introduced in v0.20, how you access types has changed. WXT now provides types based on `@types/chrome` instead of `@types/webextension-polyfill`.

These types are more up-to-date with MV3 APIs, contain less bugs, are better organized, and don't have any auto-generated names.

To access types, use the new `Browser` namespace from `wxt/browser`:

<!-- prettier-ignore -->
```ts
import type { Runtime } from 'wxt/browser'; // [!code --]
import type { Browser } from 'wxt/browser'; // [!code ++]

function getMessageSenderUrl(sender: Runtime.MessageSender): string { // [!code --]
function getMessageSenderUrl(sender: Browser.runtime.MessageSender): string { // [!code ++]
  // ...
}
```

> If you use auto-imports, `Browser` will be available without manually importing it.

Not all type names will be the same as what `@types/webextension-polyfill` provides. You'll have to find the new type names by looking at the types of the `browser.*` API's you use.

### `public/` and `modules/` Directories Moved

The default location for the `public/` and `modules/` directories have changed to better align with standards set by other frameworks (Nuxt, Next, Astro, etc). Now, each path is relative to the project's **root directory**, not the src directory.

- If you follow the default folder structure, you don't need to make any changes.
- If you set a custom `srcDir`, you have two options:
  1.  Move the your `public/` and `modules/` directories to the project root:
      <!-- prettier-ignore -->
      ```html
      📂 {rootDir}/
         📁 modules/ <!-- [!code ++] -->
         📁 public/ <!-- [!code ++] -->
         📂 src/
            📁 components/
            📁 entrypoints/
            📁 modules/ <!-- [!code --] -->
            📁 public/ <!-- [!code --] -->
            📁 utils/
            📄 app.config.ts
         📄 wxt.config.ts
      ```
  2.  Keep the folders in the same place and update your project config:
      ```ts [wxt.config.ts]
      export default defineConfig({
        srcDir: 'src',
        publicDir: 'src/public', // [!code ++]
        modulesDir: 'src/modules', // [!code ++]
      });
      ```

### Import Path Changes and `#imports`

The APIs exported by `wxt/sandbox`, `wxt/client`, or `wxt/storage` have moved to individual exports under the `wxt/utils/*` path.

:::details Why?
As WXT grows and more utilities are added, any helper with side-effects will not be tree-shaken out of your final bundle.

This can cause problems because not every API used by these side-effects is available in every type of entrypoint. Some APIs can only be used in the background, sandboxed pages can't use any extension API, etc. This was leading to JS throwing errors in the top-level scope, preventing your code from running.

Splitting each util into it's own module solves this problem, making sure you're only importing APIs and side-effects into entrypoints they can run in.
:::

Refer to the updated [API Reference](/api/reference/) to see the list of new import paths.

However, you don't need to memorize or learn the new import paths! v0.20 introduces a new virtual module, `#imports`, that abstracts all this away from developers. See the [blog post](/blog/2024-12-06-using-imports-module) for more details about how this module works.

So to upgrade, just replace any imports from `wxt/storage`, `wxt/client`, and `wxt/sandbox` with an import to the new `#imports` module:

```ts
import { storage } from 'wxt/storage'; // [!code --]
import { defineContentScript } from 'wxt/sandbox'; // [!code --]
import { ContentScriptContext, useAppConfig } from 'wxt/client'; // [!code --]
import { storage } from '#imports'; // [!code ++]
import { defineContentScript } from '#imports'; // [!code ++]
import { ContentScriptContext, useAppConfig } from '#imports'; // [!code ++]
```

You can combine the imports into a single import statement, but it's easier to just find/replace each statement.

```ts
import { storage } from 'wxt/storage'; // [!code --]
import { defineContentScript } from 'wxt/sandbox'; // [!code --]
import { ContentScriptContext, useAppConfig } from 'wxt/client'; // [!code --]
import {
  // [!code ++]
  storage, // [!code ++]
  defineContentScript, // [!code ++]
  ContentScriptContext, // [!code ++]
  useAppConfig, // [!code ++]
} from '#imports'; // [!code ++]
```

:::tip
Before types will work, you'll need to run `wxt prepare` after installing v0.20 to generate the new TypeScript declarations.
:::

### `createShadowRootUi` CSS Changes

WXT now resets styles inherited from the webpage (`visibility`, `color`, `font-size`, etc.) by setting `all: initial` inside the shadow root.

:::warning
This doesn't effect `rem` units. You should continue using `postcss-rem-to-px` or an equivalent library if the webpage sets the HTML element's `font-size`.
:::

If you use `createShadowRootUi`:

1. Remove any manual CSS overrides that reset the style of specific websites. For example:

   <!-- prettier-ignore -->
   ```css [entrypoints/reddit.content/style.css]
   body { /* [!code --] */
     /* Override Reddit's default "hidden" visibility on elements */ /* [!code --] */
     visibility: visible !important; /* [!code --] */
   } /* [!code --] */
   ```

2. Double check that your UI looks the same as before.

If you run into problems with the new behavior, you can disable it and continue using your current CSS:

```ts
const ui = await createShadowRootUi({
  inheritStyles: true, // [!code ++]
  // ...
});
```

### Default Output Directories Changed

The default value for the [`outDirTemplate`](/api/reference/wxt/interfaces/InlineConfig#outdirtemplate) config has changed. Now, different build modes are output to different directories:

- `--mode production` &rarr; `.output/chrome-mv3`: Production builds are unchanged
- `--mode development` &rarr; `.output/chrome-mv3-dev`: Dev mode now has a `-dev` suffix so it doesn't overwrite production builds
- `--mode custom` &rarr; `.output/chrome-mv3-custom`: Other custom modes end with a `-[mode]` suffix

To use the old behavior, writing all output to the same directory, set the `outDirTemplate` option:

```ts [wxt.config.ts]
export default defineConfig({
  outDirTemplate: '{{browser}}-mv{{manifestVersion}}', // [!code ++]
});
```

:::warning
If you've previously loaded the extension into your browser manually for development, you'll need to uninstall and re-install it from the new dev output directory.
:::

### Deprecated APIs Removed

- `entrypointLoader` option: WXT now uses `vite-node` for importing entrypoints during the build process.
  > This was deprecated in v0.19.0, see the [v0.19 section](#v0-18-5-rarr-v0-19-0) for migration steps.
- `transformManifest` option: Use the `build:manifestGenerated` hook to transform the manifest instead:
  <!-- prettier-ignore -->
  ```ts [wxt.config.ts]
  export default defineConfig({
    transformManifest(manifest) { // [!code --]
    hooks: { // [!code ++]
      'build:manifestGenerated': (_, manifest) => { // [!code ++]
         // ...
      }, // [!code ++]
    },
  });
  ```

### New Deprecations

#### `runner` APIs Renamed

To improve consistency with the `web-ext.config.ts` filename, the "runner" API and config options have been renamed. You can continue using the old names, but they have been deprecated and will be removed in a future version:

1. The `runner` option has been renamed to `webExt`:
   ```ts [wxt.config.ts]
   export default defineConfig({
     runner: { // [!code --]
     webExt: { // [!code ++]
       startUrls: ["https://wxt.dev"],
     },
   });
   ```
2. `defineRunnerConfig` has been renamed to `defineWebExtConfig`:
   ```ts [web-ext.config.ts]
   import { defineRunnerConfig } from 'wxt'; // [!code --]
   import { defineWebExtConfig } from 'wxt'; // [!code ++]
   ```
3. The `ExtensionRunnerConfig` type has been renamed to `WebExtConfig`
   ```ts
   import type { ExtensionRunnerConfig } from 'wxt'; // [!code --]
   import type { WebExtConfig } from 'wxt'; // [!code ++]
   ```

## v0.18.5 &rarr; v0.19.0

### `vite-node` Entrypoint Loader

The default entrypoint loader has changed to `vite-node`. If you use any NPM packages that depend on the `webextension-polyfill`, you need to add them to Vite's `ssr.noExternal` option:

<!-- prettier-ignore -->
```ts [wxt.config.ts]
export default defineConfig({
  vite: () => ({ // [!code ++]
    ssr: { // [!code ++]
      noExternal: ['@webext-core/messaging', '@webext-core/proxy-service'], // [!code ++]
    }, // [!code ++]
  }), // [!code ++]
});
```

> [Read the full docs](/guide/essentials/config/entrypoint-loaders#vite-node) for more information.

:::details This change enables:

Importing variables and using them in the entrypoint options:

```ts [entrypoints/content.ts]
import { GOOGLE_MATCHES } from '~/utils/constants'

export default defineContentScript({
  matches: [GOOGLE_MATCHES],
  main: () => ...,
})
```

Using Vite-specific APIs like `import.meta.glob` to define entrypoint options:

```ts [entrypoints/content.ts]
const providers: Record<string, any> = import.meta.glob('../providers/*', {
  eager: true,
});

export default defineContentScript({
  matches: Object.values(providers).flatMap(
    (provider) => provider.default.paths,
  ),
  async main() {
    console.log('Hello content.');
  },
});
```

Basically, you can now import and do things outside the `main` function of the entrypoint - you could not do that before. Still though, be careful. It is recommended to avoid running code outside the `main` function to keep your builds fast.

:::

To continue using the old approach, add the following to your `wxt.config.ts` file:

```ts [wxt.config.ts]
export default defineConfig({
  entrypointLoader: 'jiti', // [!code ++]
});
```

:::warning
`entrypointLoader: "jiti"` is deprecated and will be removed in the next major version.
:::

### Drop CJS Support

WXT no longer ships with Common JS support. If you're using CJS, here's your migration steps:

1. Add [`"type": "module"`](https://nodejs.org/api/packages.html#type) to your `package.json`.
2. Change the file extension of any `.js` files that use CJS syntax to `.cjs`, or update them to use EMS syntax.

Vite also provides steps for migrating to ESM. Check them out for more details: https://vitejs.dev/guide/migration#deprecate-cjs-node-api

## v0.18.0 &rarr; v0.18.5

> When this version was released, it was not considered a breaking change... but it should have been.

### New `modules/` Directory

WXT now recognizes the `modules/` directory as a folder containing [WXT modules](/guide/essentials/wxt-modules).

If you already have `<srcDir>/modules` or `<srcDir>/Modules` directory, `wxt prepare` and other commands will fail.

You have two options:

1. [Recommended] Keep your files where they are and tell WXT to look in a different folder:
   ```ts [wxt.config.ts]
   export default defineConfig({
     modulesDir: 'wxt-modules', // defaults to "modules"
   });
   ```
2. Rename your `modules` directory to something else.

## v0.17.0 &rarr; v0.18.0

### Automatic MV3 `host_permissions` to MV2 `permissions`

> Out of an abundance of caution, this change has been marked as a breaking change because permission generation is different.

If you list `host_permissions` in your `wxt.config.ts`'s manifest and have released your extension, double check that your `permissions` and `host_permissions` have not changed for all browsers you target in your `.output/*/manifest.json` files. Permission changes can cause the extension to be disabled on update, and can cause a drop in users, so be sure to double check for differences compared to the previous manifest version.

## v0.16.0 &rarr; v0.17.0

### Storage - `defineItem` Requires `defaultValue` Option

If you were using `defineItem` with versioning and no default value, you will need to add `defaultValue: null` to the options and update the first type parameter:

```ts
const item = storage.defineItem<number>("local:count", { // [!code --]
const item = storage.defineItem<number | null>("local:count", { // [!code ++]
defaultValue: null, // [!code ++]
  version: ...,
  migrations: ...,
})
```

The `defaultValue` property is now required if passing in the second options argument.

If you exclude the second options argument, it will default to being nullable, as before.

```ts
const item: WxtStorageItem<number | null> =
  storage.defineItem<number>('local:count');
const value: number | null = await item.getValue();
```

### Storage - Fix Types In `watch` Callback

> If you don't use TypeScript, this isn't a breaking change, this is just a type change.

```ts
const item = storage.defineItem<number>('local:count', { defaultValue: 0 });
item.watch((newValue: number | null, oldValue: number | null) => { // [!code --]
item.watch((newValue: number, oldValue: number) => { // [!code ++]
  // ...
});
```

## v0.15.0 &rarr; v0.16.0

### Output Directory Structure Changed

JS entrypoints in the output directory have been moved. Unless you're doing some kind of post-build work referencing files, you don't have to make any changes.

```
.output/
  <target>/
    chunks/
      some-shared-chunk-<hash>.js
      popup-<hash>.js // [!code --]
    popup.html
    popup.html
    popup.js // [!code ++]
```

## v0.14.0 &rarr; v0.15.0

### Renamed `zip.ignoredSources` to `zip.excludeSources`

```ts [wxt.config.ts]
export default defineConfig({
  zip: {
    ignoredSources: [
      /*...*/
    ], // [!code --]
    excludeSources: [
      /*...*/
    ], // [!code ++]
  },
});
```

### Renamed Undocumented Constants

Renamed undocumented constants for detecting the build config at runtime in [#380](https://github.com/wxt-dev/wxt/pull/380). Now documented here: https://wxt.dev/guide/multiple-browsers.html#runtime

- `__BROWSER__` → `import.meta.env.BROWSER`
- `__COMMAND__` → `import.meta.env.COMMAND`
- `__MANIFEST_VERSION__` → `import.meta.env.MANIFEST_VERSION`
- `__IS_CHROME__` → `import.meta.env.CHROME`
- `__IS_FIREFOX__` → `import.meta.env.FIREFOX`
- `__IS_SAFARI__` → `import.meta.env.SAFARI`
- `__IS_EDGE__` → `import.meta.env.EDGE`
- `__IS_OPERA__` → `import.meta.env.OPERA`

## v0.13.0 &rarr; v0.14.0

### Content Script UI API changes

`createContentScriptUi` and `createContentScriptIframe`, and some of their options, have been renamed:

- `createContentScriptUi({ ... })` &rarr; `createShadowRootUi({ ... })`
- `createContentScriptIframe({ ... })` &rarr; `createIframeUi({ ... })`
- `type: "inline" | "overlay" | "modal"` has been changed to `position: "inline" | "overlay" | "modal"`
- `onRemove` is now called **_before_** the UI is removed from the DOM, previously it was called after the UI was removed
- `mount` option has been renamed to `onMount`, to better match the related option, `onRemove`.

## v0.12.0 &rarr; v0.13.0

### New `wxt/storage` APIs

`wxt/storage` no longer relies on [`unstorage`](https://www.npmjs.com/package/unstorage). Some `unstorage` APIs, like `prefixStorage`, have been removed, while others, like `snapshot`, are methods on the new `storage` object. Most of the standard usage remains the same. See https://wxt.dev/guide/storage and https://wxt.dev/api/reference/wxt/storage/ for more details ([#300](https://github.com/wxt-dev/wxt/pull/300))

## v0.11.0 &rarr; v0.12.0

### API Exports Changed

`defineContentScript` and `defineBackground` are now exported from `wxt/sandbox` instead of `wxt/client`. ([#284](https://github.com/wxt-dev/wxt/pull/284))

- If you use auto-imports, no changes are required.
- If you have disabled auto-imports, you'll need to manually update your import statements:
  ```ts
  import { defineBackground, defineContentScript } from 'wxt/client'; // [!code --]
  import { defineBackground, defineContentScript } from 'wxt/sandbox'; // [!code ++]
  ```

## v0.10.0 &rarr; v0.11.0

### Vite 5

You will need to update any other Vite plugins to a version that supports Vite 5.

## v0.9.0 &rarr; v0.10.0

### Extension Icon Discovery

WXT no longer discovers icons other than `.png` files. If you previously used `.jpg`, `.jpeg`, `.bmp`, or `.svg`, you'll need to convert your icons to `.png` files or manually add them to the manifest inside your `wxt.config.ts` file.

## v0.8.0 &rarr; v0.9.0

### Removed `WebWorker` Types by Default

Removed [`"WebWorker"` types](https://www.typescriptlang.org/tsconfig/lib.html) from `.wxt/tsconfig.json`. These types are useful for MV3 projects using a service worker.

To add them back to your project, add the following to your project's TSConfig:

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    // [!code ++]
    "lib": ["ESNext", "DOM", "WebWorker"] // [!code ++]
  } // [!code ++]
}
```

## v0.7.0 &rarr; v0.8.0

### `defineUnlistedScript`

Unlisted scripts must now `export default defineUnlistedScript(...)`.

### `BackgroundDefinition` Type

Rename `BackgroundScriptDefintition` to `BackgroundDefinition`.

## v0.6.0 &rarr; v0.7.0

### Content Script CSS Output Location Changed

Content script CSS used to be output to `assets/<name>.css`, but is now `content-scripts/<name>.css` to match the docs.

## v0.5.0 &rarr; v0.6.0

### Require a Function for `vite` Config

The `vite` config option must now be a function. If you were using an object before, change it from `vite: { ... }` to `vite: () => ({ ... })`.

## v0.4.0 &rarr; v0.5.0

### Revert Move Public Directory

Change default `publicDir` to from `<rootDir>/public` to `<srcDir>/public`.

## v0.3.0 &rarr; v0.4.0

### Update Default Path Aliases

Use relative path aliases inside `.wxt/tsconfig.json`.

## v0.2.0 &rarr; v0.3.0

### Move Public Directory

Change default `publicDir` to from `<srcDir>/public` to `<rootDir>/public`.

### Improve Type Safety

Add type safety to `browser.runtime.getURL`.

## v0.1.0 &rarr; v0.2.0

### Rename `defineBackground`

Rename `defineBackgroundScript` to `defineBackground`.
