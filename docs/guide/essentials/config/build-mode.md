# Build Modes

Because WXT is powered by Vite, supports [modes](https://vite.dev/guide/env-and-mode.html#modes) in the same way.

When running any dev or build commands, pass the `--mode` flag:

```sh
wxt --mode production
wxt build --mode development
wxt zip --mode testing
```

By default, `--mode` is `development` for the dev command and `production` for all other commands (build, zip, etc).

## Dotenv Files

Just like with Vite, depending on the `--mode` you pass, different dotenv files are loaded:

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

## Get Mode at Runtime

You can access the current mode in your extension using `import.meta.env.MODE`:

```ts
switch (import.meta.env.MODE) {
  case 'development': // ...
  case 'production': // ...

  // Custom modes specified with --mode
  case 'testing': // ...
  case 'staging': // ...
  // ...
}
```

## `NODE_ENV` vs Mode

Just like Vite, you can also set `NODE_ENV` before running a command:

```sh
NODE_ENV=development wxt zip
```

It's important to note that `NODE_ENV` is completely unrelated to modes. It corresponds with the `import.meta.env.DEV` and `import.meta.env.PROD`, not `import.meta.env.MODE`.

[Vite's docs](https://vite.dev/guide/env-and-mode.html#node-env-and-modes) go into much more detail about this difference. WXT behaves the same way as Vite.
