---
outline: deep
---

# Manifest.json

The manifest.json is generated at build-time based on files in the `entrypoints/` directory and `wxt.config.ts`.

## Configuration

While entrypoints are generated and added to the manifest at build-time, you can customize or add to your `manifest.json` in the config file.

```ts
// wxt.config.ts entrypoint of your extension
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    host_permissions: ['*://google.com/*'],
    content_security_policy: {
      // ...
    },
  },
});
```

### `name`

If not provided via the `manifest` config, the [manifest's `name`](https://developer.chrome.com/docs/extensions/mv3/manifest/name/) defaults to your package.json's `name` property.

### `version` and `version_name`

The [manifest's `version` and `version_name`](https://developer.chrome.com/docs/extensions/mv3/manifest/version/) properties are based on the `version` field listed in your `package.json` or `wxt.config.ts`.

- `version_name` is the exact string listed in your `package.json` or `wxt.config.ts` file
- `version` is the string cleaned up, with any invalid suffixes removed

If a version is not found, a warning is logged and the version defaults to `"0.0.0"`.

#### Example

```json
// package.json
{
  "version": "1.3.0-alpha2"
}
```

```json
// .output/<dir>/manifest.json
{
  "version": "1.3.0",
  "version_name": "1.3.0-alpha2"
}
```

### `icons`

By default, WXT will discover icons in your [`public` directory](/guide/assets#public-directory) and use them for the [manifest's `icons`](https://developer.chrome.com/docs/extensions/mv3/manifest/icons/).

```
public/
├─ icon-16.png
├─ icon-24.png
├─ icon-48.png
├─ icon-96.png
└─ icon-128.png
```

Icon files need to match the following regex to be automatically included in the manifest. Most design software can output icons in one of these formats

<<< @/../src/core/utils/manifest.ts#snippet

If you prefer to use filenames in a different format, you can add the icons manually in your `wxt.config.ts` file:

```ts
export default defineConfig({
  manifest: {
    icons: {
      16: '/extension-icon-16.png',
      24: '/extension-icon-24.png',
      48: '/extension-icon-48.png',
      96: '/extension-icon-96.png',
      128: '/extension-icon-128.png',
    },
  },
});
```

### `permissions`

[Permissions](https://developer.chrome.com/docs/extensions/reference/permissions/) must be listed in the manifest config.

```ts
export default defineConfig({
  manifest: {
    permissions: ['storage', 'tabs'],
  },
});
```

## Localization

Similar to the icon, the [`_locales` directory](https://developer.chrome.com/docs/extensions/reference/i18n/) should be placed inside the the WXT's [`public` directory](/guide/assets#public-directory).

```
public/
└─ _locales/
   ├─ en/
   │  └─ messages.json
   ├─ es/
   │  └─ messages.json
   └─ ko/
      └─ messages.json
```

Then you'll need to explicitly override the `name` and `description` properties in your config for them to be localized.

```ts
export default defineConfig({
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
  },
});
```

See the official localization examples for more details:

<ExampleList tag="i18n" />

## Per-Manifest Version Config

WXT applies several transformations to your manifest to simplify managing both MV2 and MV3 keys in your `wxt.config.ts` file:

1. Top level MV2-only or MV3-only keys are stripped from the final manifest when targeting the other manifest version
2. Some keys, are automatically converted between versions when possible:
   - Define `web_accessible_resources` in it's MV3 style and it will be converted to the MV2 style automatically
   - `action` will automatically be converted to `browser_action` for MV3. To use `page_action` instead, add both `action` and `page_action` entries to your manifest

For example, a `wxt.config.ts` file that looks like this:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  mainfest: {
    action: {
      default_title: 'Some Title',
    },
    web_accessible_resources: [
      {
        matches: ['*://*.google.com/*'],
        resources: ['icon/*.png'],
      },
    ],
  },
});
```

Will be output differently for each manifest version:

:::code-group

```json [MV2]
{
  "manifest_version": 2,
  // ...
  "browser_action": {
    "default_title": "Some Title"
  },
  "web_accessible_resources": ["icon/*.png"]
}
```

```json [MV3]
{
  "manifest_version": 3,
  // ...
  "action": {
    "default_title": "Some Title"
  },
  "web_accessible_resources": [
    {
      "matches": ["*://*.google.com/*"],
      "resources": ["icon/*.png"]
    }
  ]
}
```

:::

:::tip
If this isn't enough control for your use-case, remember you can use a function for the `manifest` key and generate it however you'd like, or you can use the `build:manifestGenerated` hook to apply additional transformations.
:::

## Per-Browser Configuration

The `manifest` field can be a function. If you are building and extension for multiple browsers, and need to modify the manifest per browser, using a function instead of an object is very useful.

```ts
export default defineConfig({
  manifest: ({ browser, manifestVersion, mode, command }) => {
    return {
      // Your manifest
    };
  },
});
```

:::info
The first argument is of type `ConfigEnv`. See the [API reference](/api/wxt/interfaces/ConfigEnv) for info about each property.
:::

For example, say you use OAuth, and you need to provide a different `oauth.client_id` for each browser:

```ts
const clientIds = {
  chrome: '<your-chrome-client-id>',
  edge: '<your-edge-client-id>',
  firefox: '<your-firefox-client-id>',
  opera: '<your-opera-client-id>',
};

export default defineConfig({
  manifest: ({ browser }) => ({
    oauth: {
      client_id: clientIds[browser],
      scopes: [
        // ...
      ],
    },
  }),
});
```
