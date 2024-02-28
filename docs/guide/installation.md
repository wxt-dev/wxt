# Installation

Bootstrap a new project, start from scratch, or [migrate an existing project](/guide/migrate-to-wxt).

## Bootstrap Project

:::code-group

```sh [pnpm]
pnpx wxt@latest init <project-name>
```

```sh [npm]
npx wxt@latest init <project-name>
```

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
pnpm add -D wxt
```

```sh [npm]
npm i --save-dev wxt
```

```sh [yarn]
yarn add --dev wxt
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

## Migrate an Existing Project

Before starting the migration, it is recommended to run `pnpx wxt@latest init` to see what a basic project looks like. Once you have an understanding of how WXT projects are structured, you're ready to convert the project, using the initialized project as a reference.

Migrating a project to WXT comes down to a few steps:

1. Install WXT and remove any old build tools: `pnpm i -D wxt`
1. Refactoring/move your entrypoints to the `entrypoints` directory
1. Moving public assets to the `public` directory
1. Update the dev and build scripts to use WXT
1. Ensure project is compatible with Vite, which is used under the hood to bundle your extension

:::info
Since projects vary greatly in setup, [start a discussion on GitHub](https://github.com/wxt-dev/wxt/discussions/new/choose) if you need help migrating your project to WXT.
:::

## Development

Once you've installed WXT, you can start the development server using the `dev` script.

```sh
pnpm dev
```

:::tip 🎉&ensp;Well done!

The dev command will build the extension for development, open the browser, and reload the different parts of the extension when you save changes.
:::

:::details Development Manifest
When running the dev command, WXT will make several changes to your `manifest.json` to improve your development experience:

- If missing, add a background script/service worker to enable fast reloads
- Add several `permissions` and `host_permissions` to enable HMR and fast reloads
- Modify the CSP to allow connections with the dev server
- Remove `content_scripts` and register them at runtime so they can be easily reloaded when you save a file

If you're an experienced web extension developer and think the dev manifest looks wrong, this is why. Run a production build with `wxt build` to see the unmodified `manifest.json`.
:::

## Next Steps

You're ready to build your web extension!

- Learn how to [add entrypoints](./entrypoints) like the popup, options page, or content scripts
- Configure your entrypoints to [use ESM](./esm) at runtime
- [Configure WXT](./configuration) by creating a `wxt.config.ts` file
- Checkout [example projects](https://github.com/wxt-dev/wxt-examples) to see how to perform common tasks with WXT
