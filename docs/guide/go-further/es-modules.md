# ES Modules

Configure entrypoints to use ESM at runtime.

Currently, ESM entrypoints are opt-in, so you must configure each entrypoint with that in mind.

## HTML Pages <Badge type="warning" text="≥0.0.1" />

In general, you should always make HTML pages import ESM scripts, unless you need to support old browsers.

To make a script ESM, add `type="module"`:

<!-- prettier-ignore -->
```html
<script src="./main.ts"></script> <!-- [!code --] -->
<script src="./main.ts" type="module"></script> <!-- [!code ++] -->
```

## Background <Badge type="warning" text="≥0.16.0" />

In your background script, set `type: "module"`:

```ts
export default defineBackground({
  type: 'module', // !code ++
  main() {
    // ...
  },
});
```

:::warning
Only MV3 support ESM background scripts/service workers. When targeting MV2, the `type` option is ignored and the background is always bundled into a single file as IIFE.
:::

## Content Scripts

WXT does not include built-in support for ESM content scripts. There are several technical issues that make implementing a generic solution impossible. See [Content Script ESM Support #357](https://github.com/wxt-dev/wxt/issues/357) for details.

Instead, depending on your requirements, you can implement ESM support manually. See the [ESM Content Script UI](https://github.com/wxt-dev/examples/tree/main/examples/esm-content-script-ui) example to get started.
