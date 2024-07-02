# Manifest

## Overview

Sometimes, you'll need to make manual changes to how the `manifest.json` is generated. You can do this by using the `manifest` configuration:

```ts
// wxt.config.ts
export default defineConfig({
  manifest: {
    // Put manual changes here
  },
});
```

## Manifest Version Compatibility

When defining options in the manifest, always define them for MV3 when possible. WXT will either convert them to their MV2 equivalents or remove them from the generated manifest if there is not MV2 equivalent.

So for fields like `web_accessible_resources` or `content_security_policy`, you just need to list them in their MV3 forms. Other fields, like `side_panel`, which doesn't exist in MV2, will be removed automatically.

Here's an example `wxt.config.ts` file:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
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

And here's the different `manifest.json` files generated:

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

## Name

If not provided via the `manifest` config, the [manifest's `name`](https://developer.chrome.com/docs/extensions/mv3/manifest/name/) defaults to your `package.json`'s `name` property.

## Version

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

By default, WXT will discover icons in your [`public` directory](/guide/directory-structure/public/) and use them for the [manifest's `icons`](https://developer.chrome.com/docs/extensions/mv3/manifest/icons/).

```
public/
├─ icon-16.png
├─ icon-24.png
├─ icon-48.png
├─ icon-96.png
└─ icon-128.png
```

Icon files need to match the following regex to be automatically included in the manifest. Most design software can output icons in one of these formats

<<< @/../packages/wxt/src/core/utils/manifest.ts#snippet

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

### Permissions

[Permissions](https://developer.chrome.com/docs/extensions/reference/permissions/) must be listed in the manifest config.

```ts
export default defineConfig({
  manifest: {
    permissions: ['storage', 'tabs'],
  },
});
```

## Localization

Similar to the icon, the [`_locales` directory](https://developer.chrome.com/docs/extensions/reference/i18n/) should be placed inside the the WXT's [`public` directory](/guide/directory-structure/public/).

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

- [I18n](https://github.com/wxt-dev/wxt-examples/tree/main/examples/vanilla-i18n#readme)
- [Vue I18n](https://github.com/wxt-dev/wxt-examples/tree/main/examples/vue-i18n#readme)

## Actions

In MV2, you had two options: [`browser_action`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) and [`page_action`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/page_action). In MV3, they were merged into a single [`action`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/action) API.

By default, whenever an action is generated, WXT falls back to `browser_action` when targetting MV2.

### Action With Popup

To generate a manifest where a UI appears after clicking the icon, just create a [popup entrypoint](/guide/directory-structure/entrypoints/popup).

If you want to use a `page_action` for MV2, add the following `meta` tag to the HTML document's head:

```html
<meta name="manifest.type" content="page_action" />
```

### Action Without Popup

If you want to use the `activeTab` permission or the `browser.action.onClick` event, but don't want to show a popup UI:

1. Delete the [popup entrypoint](/guide/directory-structure/entrypoints/popup) if it exists
2. Add the `action` key to your manifest:
   ```ts
   // wxt.config.ts
   export default defineConfig({
     manifest: {
       action: {},
     },
   });
   ```

Same as an action with a popup, WXT will fallback on using `browser_action` for MV2. To use a `page_action` instead, add that key as well:

```ts
// wxt.config.ts
export default defineConfig({
  manifest: {
    action: {},
    page_action: {},
  },
});
```

## Full Control

The `manifest` option can also be set equal to a function, letting you use logical statements to determine what should be output.

```ts
// wxt.config.ts
export default defineConfig({
  manifest: ({ manifestVersion, browser, mode, comamnd }) => {
    return { ... }
  }
})
```

Or, you can use the `build:manifestGenerated` hook to transform the manifest before it is written to the output directory.

```ts
// wxt.config.ts
export default defineConfig({
  hooks: {
    build: {
      manifestGenerated(manifest) {
        // Update the manifest variable by reference
        manifest.name = 'Overriden name';
      },
    },
  },
});
```
