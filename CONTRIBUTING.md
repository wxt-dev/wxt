# Contributing

Everyone is welcome to contribute to **WXT**!

If you are changing the docs or fixing a bug, feel free to fork and open a PR.

If you want to add a new feature, please create an issue or discussion first so we can decide if the feature is inline with the vision for WXT.

## Conventional Commits

This project uses [Conventional Commit format](https://www.conventionalcommits.org/en/v1.0.0/) to automatically generate a changelog and better understand the changes in the project

Here are some examples of conventional commit messages:

- `feat: add new functionality`
- `fix: correct typos in code`
- `ci: add GitHub Actions for automated testing`

## Conventional PR Titles

The title of your pull request should follow the [conventional commit format](#conventional-commits). When a pull request is merged to the main branch, all changes are going to be squashed into a single commit. The message of this commit will be the title of the pull request. And for every release, the commit messages are used to generate the changelog.

## Setup

WXT uses Bun for package management and development. Install it from: <https://bun.com/>

Then, simply run the install command:

```sh
bun install
```

## Development

Here are some helpful commands:

```sh
# Build WXT package and workspace dependencies
bun run -F wxt build
```

```sh
# Build workspace dependencies, then start the demo extension in dev mode
bun run -F wxt-demo dev
```

```sh
# Run unit and E2E tests
bun run test
```

```sh
# Start the docs website locally
bun run docs:dev
```

> Above, we used bun's `-F` flag to choose which package to run a command in, but there are other ways
>
> ```sh
> bun run -F @wxt-dev/i18n build
> # or
> bun run --cwd packages/i18n build
> # or
> cd packages/i18n
> bun run build
> ```
>
> Pick your poison!

## Profiling

```sh
# Build the latest version
bun run -F wxt build

# CD to the demo directory
cd packages/wxt-demo
```

Then there are a few different ways to profile WXT commands:

- Generate a flamechart with 0x:

  ```sh
  bunx 0x node_modules/wxt/bin/wxt.mjs build
  ```

- Create a CPU profile:

  ```sh
  bun run --cpu-prof node_modules/wxt/bin/wxt.mjs build
  ```

- Debug the process:

  ```sh
  bun run --inspect node_modules/wxt/bin/wxt.mjs build
  ```

## Updating Docs

Documentation is written with VitePress, and is located in the `docs/` directory.

The API reference is generated from JSDoc comments in the source code. If there's a typo or change you want to make in there, you'll need to update the source code instead of a file in the `docs/` directory.

## Testing

WXT has unit and E2E tests. When making a change or adding a feature, make sure to update the tests or add new ones, if they exist.

> If they don't exist, feel free to create them, but that's a lot for a one-time contributor. A maintainer might add them to your PR though.

To run tests for a specific file, add the filename at the end of the test command:

```sh
bun run -F wxt test manifest-contents
```

All test (unit and E2E) for all packages are ran together via [Vitest workspaces](https://vitest.dev/guide/#workspaces-support).

If you want to manually test a change, you can modify the demo project for your test, but please don't leave those changes committed once you open a PR.

## Templates

Each directory inside `templates/` is it's own standalone project. Simply `cd` into the directory you're updating, install dependencies with `npm` (NOT `bun`), and run the relevant commands

```sh
cd templates/vue
npm i
npm run dev
npm run build
```

Note that templates are hardcoded to a specific version of `wxt` from NPM, they do not use the local version. PR checks will test your PR's changes against the templates, but if you want to manually do it, update the package.json dependency:

```diff
  "devDependencies": {
    "typescript": "^5.3.2",
    "vite-plugin-solid": "^2.7.0",
-   "wxt": "^0.8.0"
+   "wxt": "../../packages/wxt"
  }
```

Then run `npm i` again.

### Adding Templates

To add a template, copy the vanilla template and give it a new name.

```sh
cp -r templates/vanilla templates/<new-template-name>
```

That's it. Once your template is merged, it will be available inside `wxt init` immediately. You don't need to release a new version of WXT to release a new template.

All current templates are based on Vite's templates: <https://github.com/vitejs/vite/tree/main/packages/create-vite>

## Releasing Updates

Releases are done with GitHub actions:

- Use the [Release workflow](https://github.com/wxt-dev/wxt/actions/workflows/release.yml) to release a single package in the monorepo. This automatically detects the version change with conventional commits, builds and uploads the package to NPM, and creates a GitHub release.
- Use the [Sync Releases workflow](https://github.com/wxt-dev/wxt/actions/workflows/sync-releases.yml) to sync the GitHub releases with changes to the changelog. To change a release, update the `CHANGELOG.md` file and run the workflow. It will sync the releases of a single package in the monorepo.

## Upgrading Dependencies

WXT has custom rules around what dependencies can be upgraded. Use the `scripts/upgrade-deps.ts` script to upgrade dependencies and follow these rules.

```sh
bun run scripts/upgrade-deps.ts
```

To see all the options, run:

```sh
bun run scripts/upgrade-deps.ts --help
```

## Install Unreleased Versions

This repo uses <https://pkg.pr.new> to publish versions of all it's packages for almost every commit. You can install them via:

```sh
npm i https://pkg.pr.new/[package-name]@[ref]
```

Or use one of the shorthands:

```sh
# Install the latest build of `wxt` from a PR:
npm i https://pkg.pr.new/wxt@1283

# Install the latest build of `@wxt-dev/module-react` on the `main` branch
npm i https://pkg.pr.new/@wxt-dev/module-react@main

# Install `@wxt-dev/storage` from a specific commit:
npm i https://pkg.pr.new/@wxt-dev/module-react@426f907
```

## Blog Posts

Anyone is welcome to submit a blog post on <https://wxt.dev/blog>!

> [!NOTE]
> Before starting on a blog post, please message Aaron on Discord or start a discussion on GitHub to get permission to write about a topic, but most topics are welcome: Major version updates, tutorials, etc.

- **English only**: Blog posts should be written in English. Unfortunately, our maintainers don't have the bandwidth right now to translate our docs, let alone blog posts. Sorry 😓
- **AI**: Please only use AI to translate or proof-read your blog post. Don't generate the whole thing... We don't want to publish that.
