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

## 3. Prefer locally downloaded prose docs

If `.wxt/docs/v<version>/` exists, read docs from there. Paths under that directory mirror wxt.dev URLs:

- `.wxt/docs/v<version>/guide/essentials/config/manifest.md`
- `.wxt/docs/v<version>/guide/essentials/entrypoints.md`
- `.wxt/docs/v<version>/guide/essentials/content-scripts.md`
- `.wxt/docs/v<version>/guide/essentials/wxt-modules.md`
- `.wxt/docs/v<version>/guide/resources/upgrading.md`

If the directory is missing, run `wxt docs` (or ask the user to), then read from it.

- `--out-dir <dir>` changes the base directory; docs still land in `<dir>/v<version>/`
- `--force` redownloads the current version
- Users can point `AGENTS.md` at these files (for example `@.wxt/docs/v<version>/guide/essentials/entrypoints.md`). Update that path after upgrading WXT.

## 4. Fall back to the matching git tag

If a local download is unavailable, fetch prose docs from the monorepo tag. Docs live in `wxt-dev/wxt` under `docs/`. Release tags are `wxt-v<version>` (for example `wxt-v0.20.27`).

Raw file URL pattern:

```text
https://raw.githubusercontent.com/wxt-dev/wxt/wxt-v<version>/docs/<path>.md
```

Examples:

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

## 5. Handle version differences

- Read `docs/guide/resources/upgrading.md` **at the latest tag**. It lists breaking changes between versions. Compare it to the project's version.
- Do not use `.wxt/docs/v<version>/guide/resources/upgrading.md` for this unless that version is the latest. `wxt docs` only downloads the installed version.
- If the user's version is older than the docs you're reading, say so and note any API differences you can see in the local `.d.mts` types.

## 6. Latest-only shortcuts (use only when the project is on the latest version)

- `https://wxt.dev/llms.txt`: index of all pages.
- Individual pages: `https://wxt.dev/guide/essentials/<page>.md`
- `https://wxt.dev/llms-full.txt`: **very large** (the whole site, including the entire API reference). Don't fetch it by default. Fetch individual pages instead.
- API reference: `https://wxt.dev/api/reference/wxt/interfaces/<Name>.md` (generated from the types and links to source lines on GitHub).

## 7. Report your source

When answering, state which WXT version you based it on and where the information came from (local types, `.wxt/docs/v<version>`, tag-pinned docs, or latest docs). Flag anything you could not verify for that version.
