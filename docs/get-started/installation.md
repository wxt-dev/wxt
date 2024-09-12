# Installation

Bootstrap a new project, start from scratch, or [migrate an existing project](/get-started/migrate-to-wxt).

## Bootstrap Project

:::code-group

```sh [pnpm]
pnpm dlx wxt@latest init <project-name>
```

```sh [npm]
npx wxt@latest init <project-name>
```

```sh [bun]
# The "wxt init" command currently fails when ran with bunx.
# Use NPX as a workaround, and select "bun" as your package
# manager. To stay up to date with this issue, follow
# https://github.com/wxt-dev/wxt/issues/707
#
# bunx wxt@latest init <project-name>

npx wxt@latest init <project-name>
```

### Demo

![wxt init demo](/assets/demo.gif)

:::

There are several starting templates available.

| TypeScript                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <Icon name="TypeScript" /> [`vanilla`](https://github.com/wxt-dev/wxt/tree/main/templates/vanilla)                                                      |
| <Icon name="Vue" /> [`vue`](https://github.com/wxt-dev/wxt/tree/main/templates/vue)                                                                     |
| <Icon name="React" /> [`react`](https://github.com/wxt-dev/wxt/tree/main/templates/react)                                                               |
| <Icon name="Svelte" /> [`svelte`](https://github.com/wxt-dev/wxt/tree/main/templates/svelte)                                                            |
| <Icon name="Solid" icon="https://www.solidjs.com/img/favicons/favicon-32x32.png" /> [`solid`](https://github.com/wxt-dev/wxt/tree/main/templates/solid) |

:::info
All templates default to TypeScript. Rename the file extensions to `.js` to use JavaScript instead.
:::

## From Scratch

Initialize a project and install `wxt`:

:::code-group

```sh [pnpm]
pnpm init
pnpm add -D wxt
```

```sh [npm]
npm init
npm i --save-dev wxt
```

```sh [yarn]
yarn init
yarn add --dev wxt
```

```sh [bun]
bun init
bun add --dev wxt
```

:::

Add your first entrypoint:

```ts
// entrypoints/background.ts
export default defineBackground(() => {
  console.log(`Hello from ${browser.runtime.id}!`);
});
```

And add scripts to your `package.json`:

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

## Development

Once the project is setup, you can start the development server using the `dev` script.

```sh
pnpm dev
```

:::tip 🎉&ensp;Well done!
The dev command will build the extension for development, open the browser, and reload the different parts of the extension when you save changes.
:::

## Next Steps

You're ready to build your web extension!

- Read the rest of the "Get Started" pages for a high-overview of what WXT can do
- Read the [Guide](/guide/key-concepts/manifest) to learn in-depth about each feature WXT supports
- [Configure WXT](./configuration) by creating a `wxt.config.ts` file
- Checkout [example projects](https://github.com/wxt-dev/examples) to see how to perform common tasks with WXT
