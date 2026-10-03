# How WXT Works

WXT is two things:

1. An extendable build tool
2. A set of runtime utils

The combination of these two makes WXT a "framework". It'a really important to the WXT team that developers can use either one of these two parts of WXT independently. You can use all your own runtime utils and packages, but use WXT for building, or just use the runtime utils WXT provides with another build tool. You should be free to use them however you want.

That said, the runtime utils are all simple, isolated packages. They won't be described here. Instead, let's focus on the build tool.

## Vite: Inside or outside?

WXT uses vite under the hood for bundling JS and as the dev server. However, when projects are based on Vite, you have two options:

- Build a plugin and work "inside" Vite's lifecycle, hooking into and reacting to different processes.
- Build a CLI "outside" Vite, and use it's JS APIs to schedule builds or start the dev server whenever the project needs.

If you've used WXT, you probably know that it has it's own CLI, `wxt`, and that you don't use a `vite.config.ts` file, you use a `wxt.config.ts` file. So WXT works "outside" the Vite lifecycle. But why?

When Aaron created WXT, it was not his first foray into the extension build-tool world. He previously created `vite-plugin-web-extension`, which was a vite plugin that worked inside Vite's lifecycle. There were two problems with this approach:

1. Plugins can only react to and run code at specific times in the build process
2. Pre Environment APIs, there was no concept of multiple, independent bundles from a single `vite build`

Extensions are unique in that they're a combination of several different, independent `vite build`s. Inside a plugin, you had to schedule multiple, separate `vite build`s and somehow integrate them with the original. For dev mode, you also have to "pre-render" some files and that leads to hacks and work-arounds when working inside vite's lifecycle.

There were other reasons Aaron chose to build WXT outside of Vite:

1. Abstract the builder and leave the door open for support alternatives to Vite
2. Build it's own extensible hooks system to allow projects more control over it's build system

In fact, these design choices are very similar to the decisions the Nuxt team made, and WXT is heavily inspired by Nuxt and uses a lot of the same tooling as Nuxt internally.

## The Build Process

> `internal-build.ts`

At a high level, WXT's build process is very simple:

1. Discover entrypoints
2. Group them based on what can be bundled together
3. Build each group

Let's go through each of these steps more in-depth:

### Entrypoint Discovery

> `find-entrypoints.ts`

Entrypoints are discovered by reading the file system and looking at the files in the `wxt.config.entrypointsDir` directory that match specific filename patterns.

Because WXT decided to store config for each entrypoint in the entrypoint itself, rather than in a single location like a manifest file, WXT also needs to import or read the file to extract that info. This is... problematic. For HTML files, it's simple. Just import it, parse the DOM with `linkedom`, then find the `<meta>` elements. CSS files don't have config (as of the day this was written). It's JS entrypoints that are the problem.

JS entrypoints, like the background or content scripts, are meant to be ran in the browser. But to extract their config, we need to import the file into a NodeJS environment. That means globals, like `window` and `browser`/`chrome` are not present. So WXT does two things to import the config:

1. Polyfills common globals, like `window`, `document`, and `browser`.
2. Parses the file, removes the `main` function, and code-shakes any imports that are no longer necessary.

This process allows use to quickly import a minimal version of the entrypoint that contains just a default export of the config.

Once we've read the config from the entrypoint file, they get saved as a [`Entrypoint[]`](/api/reference/wxt/type-aliases/Entrypoint) and passed to the next stage of the build process.

### Entrypoint Grouping

> `group-entrypoints.ts`

When building extensions, some files can be bundled together with code splitting, some must be bundled independently. WXT call the process of determining what entrypoints can be bundled together "grouping".

What can be bundled together? There's really 3 types of groups:

1. ESM: ESM background, non-sandboxed HTML pages (popup, options, unlisted), and ESM content scripts
2. Sandboxed ESM: Sanboxed HTML pages
3. Individual scripts: Non-ESM background, non-ESM content scripts, and unlisted scripts

> There are some nouonces here around ESM vs non-ESM, how ESM content scripts still require a non-ESM loader as the JS file registered in the manifest. At the time of writing, WXT doesn't support ESM content scripts.

Once grouped, we return the result as a [`EntrypointGroup[]`](/api/reference/wxt/type-aliases/EntrypointGroup), which is the same as `Array<Entrypoint | Entrypoint[]>`.

### Building

> `rebuild.ts`, `vite/index.ts`

Before actually running the vite builds, we first generate the `.wxt` directory. More on this later, but for now, this directory contains generated code that needs to exist and be up-to-date before the builds will succeed.

Now WXT can run a build for each entrypoint group. This is pseudocode for what the process looks like:

- Groups with a single entrypoint are build individually with [Library Mode](https://vite.dev/guide/build#library-mode), which supports the IIFE output format. IIFE's provide good isolation and support for script return values, making it ideal for content scripts and unlisted scripts.
- Groups with more than on entrypoint are built as a [Multi-page App](https://vite.dev/guide/build#multi-page-app), which supports code-splitting between HTML and JS entrypoints.

By default, Vite's outputs don't work for extensions. WXT applies a lot of plugins to each build; anything from adding return values for lib mode scripts, polyfilling `import.meta.url`, resolving "virtual" modules, or slightly tweaking the output JS.

WXT builds all the entrypoint groups in series. Vite builds are very memory intensive, and running multiple in parallel can quickly hit Node's memory limit.

> One planned improvement here is to move from doing separate Vite builds for each group to using the [Environment API](https://vite.dev/guide/api-environment). See [#2525](https://github.com/wxt-dev/wxt/issues/2525) for tracking progress.
>
> The main benefit here is a single Vite build is responsible for building all the different entrypoint groups, and it doesn't have to re-transform or re-process the same files multiple times, theoretically speeding up builds and using less memory.

After the builds are down, WXT summarizes and outputs all the files that were generated and their size.

## Dev Mode

Dev mode is more complex compared to building.

1. Start dev server
2. Pre-render files
3. Build entrypoint groups that can't be served from the dev server (like content and unlisted scripts)
4. Open browser (or prompt to manually install)
5. Start file watcher loop:
   1. Detect the type of change
      - Will the extension need reloaded?
      - Which entrypoints groups need rebuilt?
      - Will Vite's HMR handle the change?
   2. Rebuild effected entrypoints
   3. Reload based on the type of change
      - On config changes, restart the dev server
      - On manifest changes, reload the extension
      - On rebuild or pre-rendered file change, reload effected pages or content scripts
      - Or let Vite's HMR handle the change

### Pre-render Files

Vite normally serves all content from it's dev server in dev mode. The browser loads everything from `http://localhost:5173`, and nothing is written to the `dist` directory.

That's not the case for extensions - you need to create a directory with a `manifest.json` and all entrypoints. So WXT needs to do some "pre-rendering", where it generates minimal version of all entrypoints.

For some entrypoints, like HTML pages, that's just the HTML page. Any URLs in the HTML file are pointed at the dev server on `localhost`. For others, like content scripts or the background script, there is no minimal version of the file and WXT performs a full build.

This means WXT manages a mix of full builds that are rebuilt completely when a file changes, pre-rendered HTML files that need reloaded when the HTML file changes, and Vite's HMR that handles changes to "assets" of the pre-rendered HTML files.

### Dev Server Communication

During dev mode, WXT injects additional code into your background script to setup a websocket connection with the dev server. If your extension doesn't have a background script, WXT adds one in dev mode.

The websocket connection is used to perform various types or reloads after a file is saved:

- When the server tells the extension to reload due to a manifest change, the background script runs `browser.runtime.reload()`.
- When an HTML file is changed, the background finds any tabs with that HTML page open, and reloads the tab using `browser.tabs.reload()`.
- When a content script is added, changed, or removed, the background uses the `browser.scripting` APIs to register and update the content scripts without having to reload the entire extension.

There is a lot of code in WXT dedicated to determining what type of reload is necessary when a file is changed. See `detect-dev-changes.ts` for the actual implementation, and `create-server.ts` for how the changes are communicated to the background script.

## `.wxt` Directory

One of the most powerful features of WXT is it's extentable build system. Along side [hooks](/guide/essentials/config/hooks), WXT relies heavily on code generation. Anything from the project's base `tsconfig.json`, dedicated types for each project, or runtime code can be generated inside the `.wxt` directory.

The core WXT package generates some per-project config and types. Third party NPM packages can generate runtime utils and their own types. Projects can perform module augmentation to change or add to types from NPM packages. They can change how fundamental parts of WXT's build process work, like entrypoint discovery.

## Virtual Modules

Virtual modules are fundamental to both of WXT's build process and dev mode. They are JS files generated during the build process, but that are never written to the disk. They are included in the final bundle, but you w
