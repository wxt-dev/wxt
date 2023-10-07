---
outline: deep
---

# Migrate to WXT

> If you have problems migrating to WXT, feel free to ask for help in GitHub by [starting a discussion](https://github.com/wxt-dev/wxt/discussions/new?category=q-a)!

## Overview

Always start by generating a new vanilla project and merging it into your project one file at a time.

```sh
cd path/to/your/project
pnpx wxt@latest init example-wxt --template vanilla
```

In general, you'll need to:

<input type="checkbox" /> Install `wxt`<br />
<input type="checkbox" /> Update/create `package.json` scripts to use `wxt` (don't forget about `postinstall`)<br />
<input type="checkbox" /> Move entrypoints into `entrypoints/` directory<br />
<input type="checkbox" /> Move assets into either the `assets/` or `public/` directories<br />
<input type="checkbox" /> Move manifest.json content into `wxt.config.ts`<br />
<input type="checkbox" /> Convert custom import syntax to be compatible with Vite<br />
<input type="checkbox" /> Add a default export to JS entrypoints<br />
<input type="checkbox" /> Use the `browser` global instead of `chrome`<br />
<input type="checkbox" /> Compare final `manifest.json` files, making sure permissions and host permissions are unchanged<br />
<input type="checkbox" /> Extension output by `wxt build` works the same way as before the migration<br />

Every project is different, so there's no one-solution-fits-all to migrating your project. Just make sure `wxt dev` runs, `wxt build` results in a working extension, and the list of permissions in the `manifest.json` hasn't changed. If all that looks good, you've finished migrating your extension!

## Popular Tools/Frameworks

Here's specific steps for other popuplar frameworks/build tools.

### `vite-plugin-web-extension`

Since you're already using Vite, it's a simple refactor.

1. Install `wxt`
2. Move and refactor your entrypoints to WXT's style (with a default export)
3. Update package.json scripts to use `wxt`
4. Add `"postinstall": "wxt prepare"` script
5. Move the `manifest.json` into `wxt.config.ts`
6. Move any custom settings from `vite.config.ts` into `wxt.config.ts`'s
7. Compare `dist/manifest.json` to `.output/*/manifest.json`, they should have the same content as before. If not, tweak your entrypoints and config to get as close as possible.

### `plasmo`

1. Install `wxt`
2. Move entrypoints into `entrypoints/` directory, merging the named exports used to configure your JS entrypoints into WXT's default export
3. Move public `assets/*` into the `public/` directory
4. If you use CSUI, migrate to WXT's `createContentScriptUi`
5. Convert Plasmo's custom import resolutions to Vite's
6. If importing remote code via a URL, add a `url:` prefix so it works with WXT
7. Compare your output `manifest.json` files from before the migration to after the migration. They should have the same content. If not, tweak your entrypoints and config to get as close as possible.
