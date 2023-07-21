# Installation

Bootstrap a new project or start from scratch.

## Bootstrap Project

:::warning 🚧&ensp;The `wxt init` command is not implemented yet.

See [From Scratch](#from-scratch) or reference one of the templates below.

:::

:::code-group

```sh [pnpm]
pnpx wxt@latest init
```

```sh [npm]
npx wxt@latest init
```

:::

There are several starting templates available.

| TypeScript                                                                                           |
| ---------------------------------------------------------------------------------------------------- |
| <Icon name="TypeScript" /> [`vanilla`](https://github.com/aklinker1/wxt/tree/main/templates/vanilla) |
| <Icon name="Vue" /> [`vue`](https://github.com/aklinker1/wxt/tree/main/templates/vue)                |
| <Icon name="React" /> [`react`](https://github.com/aklinker1/wxt/tree/main/templates/react)          |
| <Icon name="Svelte" /> [`svelte`](https://github.com/aklinker1/wxt/tree/main/templates/svelte)       |

> All templates are in TypeScript. WXT does not support JS at this time.

## From Scratch

Create a new NPM project:

:::code-group

```sh [pnpm]
mkdir project-name
cd project-name
pnpm init
echo 'shamefully-hoist=true' >> .npmrc
```

```sh [npm]
mkdir project-name
cd project-name
npm init
```

```sh [yarn]
mkdir project-name
cd project-name
yarn init
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

Add your first entrypoint:

```ts
// entrypoints/background.ts
export default defineBackground(() => {
  console.log(`Hello from ${browser.runtime.id}!`);
});
```

Finally, add scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "wxt", // [!code ++]
    "dev:firefox": "wxt --browser firefox", // [!code ++]
    "build": "wxt build", // [!code ++]
    "build:firefox": "wxt build --browser firefox", // [!code ++]
    "zip": "wxt zip", // [!code ++]
    "zip:firefox": "wxt zip --browser firefox", // [!code ++]
    "postinstall": "wxt prepare" // [!code ++]
  }
}
```

> You can skip `*:firefox` scripts if you don't want to support Firefox

## 🚧 WSL Support

**_WXT does not support [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/) yet_**. See [Issue #55](https://github.com/aklinker1/wxt/issues/55) to track progress.

In the meantime, you can use `cmd` instead.

## Development

Once you've installed WXT, you can start the development server using the `dev` script.

```sh
pnpm dev
```

:::tip 🎉&ensp;Well done!

The dev command will build the extension for development, open the browser, and reload the different parts of the extension when you save changes.
:::

## Next Steps

You're ready to build a out your web extension!

- Learn how to [add entrypoints](./entrypoints.md) like the popup, background, or content scripts
- [Configure WXT](./configuration.md) by creating a `wxt.config.ts` file
