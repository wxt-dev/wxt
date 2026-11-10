---
name: wxt-docs
description: Find accurate WXT (web extension framework) documentation for the exact version a project uses. Use before answering WXT questions or writing WXT code (config, entrypoints, modules, storage, content script UI, upgrades) so answers match the installed version, not just the latest docs.
---

# Finding WXT docs for a specific version

`https://wxt.dev` only serves the **latest** docs. Always determine the project's version first, then use version-matched sources.

## 1. Determine the installed version

Prefer the resolved version over the range in `package.json`:

1. `node_modules/wxt/package.json` -> `version`
2. Otherwise the lockfile (`bun.lock`, `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`)
3. Otherwise `package.json` (a range like `^0.20.0`; say so if you have to rely on it)

If WXT isn't installed or the user wants the latest, get it from `https://registry.npmjs.org/wxt/latest` (`version` field).

## 2. Check the local package (API shapes, no network)

`node_modules/wxt/dist/**/*.d.mts` ships with the package and has JSDoc. Most useful:

- `dist/types.d.mts`: `InlineConfig`, entrypoint options, hooks (`WxtHooks`), `UserManifest`, zip options
- `dist/modules.d.mts`: `defineWxtModule`, `addAlias`, `addViteConfig`, etc.
- `dist/utils/*.d.mts`: `defineBackground`, `defineContentScript`, content script UI helpers, `injectScript`
- `dist/testing/*.d.mts`: Vitest plugin and `fakeBrowser`
- Also in the project: `.wxt/types/imports-module.d.ts` (what `#imports` resolves to; run `wxt prepare` if missing)

The package does **not** include the prose docs. Use step 3 for those.

## 3. Fetch prose docs at the matching git tag

Docs live in the monorepo `wxt-dev/wxt` under `docs/`. Release tags are `wxt-v<version>` (for example `wxt-v0.20.27`).

Raw file URL pattern:

```
https://raw.githubusercontent.com/wxt-dev/wxt/wxt-v<version>/docs/<path>.md
```

Examples (the doc paths mirror the wxt.dev URLs):

- `docs/guide/essentials/config/manifest.md`
- `docs/guide/essentials/entrypoints.md`
- `docs/guide/essentials/content-scripts.md`
- `docs/guide/essentials/wxt-modules.md`
- `docs/guide/resources/upgrading.md`
- Changelog: `packages/wxt/CHANGELOG.md`

Notes:

- If a path 404s (older versions had a different doc layout), list the directory: `https://api.github.com/repos/wxt-dev/wxt/contents/docs?ref=wxt-v<version>` and navigate from there.
- To confirm a tag exists: `https://api.github.com/repos/wxt-dev/wxt/tags?per_page=100` (paginate with `&page=2`).
- Raw docs contain VitePress syntax (`:::code-group`, `<<< @/../packages/...` snippet includes). Read past it. The included snippets are source files at the same tag.
- Sub-packages (`@wxt-dev/storage`, `@wxt-dev/i18n`, `@wxt-dev/analytics`, `@wxt-dev/auto-icons`, `@wxt-dev/unocss`, module-react/vue/etc.) are versioned separately. Check the installed version of that package and look in `packages/<name>/` of the repo (README and CHANGELOG). Tag naming for these was not verified; look at the tags list first.

## 4. Handle version differences

- Read `docs/guide/resources/upgrading.md` **at the latest tag**. It lists breaking changes between every version. Compare the project's version against it.
- If the user's version is older than the docs you're reading, say so and note any API differences you can see in the local `.d.mts` types.

## 5. Latest-only shortcuts (use only when the project is on the latest version)

- `https://wxt.dev/llms.txt`: index of all pages. Caveat: the "Configuration" links in it are malformed (the path is duplicated, like `/guide/essentials/config/guide/essentials/config/manifest.md`). Fix them to `/guide/essentials/config/manifest.md`.
- Individual pages: `https://wxt.dev/guide/essentials/<page>.md`
- `https://wxt.dev/llms-full.txt`: **very large** (the whole site, including the entire API reference). Don't fetch it by default. Fetch individual pages instead.
- API reference: `https://wxt.dev/api/reference/wxt/interfaces/<Name>.md` (generated from the types and links to source lines on GitHub).

## 6. Report your source

When answering, state which WXT version you based it on and where the information came from (local types, tag-pinned docs, or latest docs). Flag anything you could not verify for that version.
