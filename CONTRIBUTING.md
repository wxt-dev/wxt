# Contributing

Everyone is welcome to contribute to WXT!

If you are changing the docs or fixing a bug, feel free to fork and open a PR.

If you want to add a new feature, please create an issue or discussion first so we can decide if the feature is inline with the vision for WXT.

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/en) to automate versioning. If you're a new contributor, don't worry about this. When you open a PR, a maintainer will change the PR's title so it's in the style of conventional commits, but that's all.

Maintainers, commits to the `main` branch (either directly or via PRs) must be valid conventional commits.

## Setup

WXT uses `pnpm`, so make sure you have it installed.

```sh
corepack enable
```

Then, simply run the install command:

```sh
pnpm i
```

## Development

Here are some helpful commands:

```sh
# Build WXT package
pnpm build
```

```sh
# Build WXT package, then build demo extension
cd demo
pnpm build
```

```sh
# Build WXT package, then start the demo extension in dev mode
cd demo
pnpm dev
```

```sh
# Run unit and E2E tests
pnpm test
```

```sh
# Start the docs website locally
pnpm docs:dev
```

## Testing

WXT has unit and E2E tests. When making a change or adding a feature, make sure to update the tests or add new ones.

To run tests for a specific file, add the filename at the end of the test command:

```sh
pnpm test manifest-contents
```

Unit and E2E tests are ran together via [Vitest workspaces](https://vitest.dev/guide/#workspaces-support).

If you want to manually test a change, you can modify the demo project for your test, but please don't leave those changes committed once you open a PR.
