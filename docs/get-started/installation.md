# Installation

Bootstrap a new project or start from scratch.

## Bootstrap Project

:::warning 🚧&ensp;This feature is not implemented yet!

See [From Scratch](#from-scratch) instead.

:::

:::code-group

```sh [pnpm]
pnpx wxt@latest init <project-name>
```

```sh [npm]
npx wxt@latest init <project-name>
```

:::

## From Scratch

Create a new NPM project:

:::code-group

```sh [pnpm]
pnpm init <project-name>
cd <project-name>
echo 'shamefully-hoist=true' >> .npmrc
```

```sh [npm]
npm init <project-name>
cd <project-name>
```

```sh [yarn]
yarn init <project-name>
cd <project-name>
```

:::

Then install `wxt`:

:::code-group

```sh [pnpm]
pnpm add wxt
```

```sh [npm]
npm i --save wxt
```

```sh [yarn]
yarn add wxt
```

:::

Finally, add `package.json` scripts:

```json
{
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt --browser firefox",
    "build": "wxt build",
    "build:firefox": "wxt build --browser firefox"
  }
}
```

## Development

Once you've installed WXT, you can start the development server using the `dev` command:

```sh
pnpm dev
```

:::tip 🎉&ensp;Well done!

The dev command will build the extension for development, open the browser, and reload the different parts of the extension when you save changes.
:::

## Next Steps

Now that your WXT project is setup, you're ready to build a out your web extension!

- Learn how to [add entrypoints](./entrypoints.md) like the popup, background, or content scripts
- [Configure WXT](./configuration.md) by creating a `wxt.config.ts` file
