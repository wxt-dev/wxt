# Manifest.json

The manifest.json is generated at build-time based on files in your `entrypoints` directory and your `wxt.config.ts`.

## Confiuration

While entrypoints are generated and added to the manifest at build-time, you can customize or add to your `manifest.json` in the config file.

```ts
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

## `name`

If not provided via the `manifest` config, the [manifest's `name`](https://developer.chrome.com/docs/extensions/mv3/manifest/name/) defaults to your package.json's `name` property.

## `version` and `version_name`

The [manifest's `version` and `version_name`](https://developer.chrome.com/docs/extensions/mv3/manifest/version/) fields are based on your package.json's `version` property.

- `version_name` is the exact string listed in your package.json
- `version` is the string cleaned up, with any invalid suffixes removed

### Example

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

## Icon

The [manifest's `icons`](https://developer.chrome.com/docs/extensions/mv3/manifest/icons/) property needs to be set in the config file. The files should be added to WXT's [`public` directory](/get-started/assets#public-directory).

```
public/
├─ icon-16.png
├─ icon-24.png
├─ icon-48.png
├─ icon-96.png
└─ icon-128.png
```

```ts
export default defineConfig({
  manifest: {
    icons: {
      16: '/icon-16.png',
      24: '/icon-24.png',
      48: '/icon-48.png',
      96: '/icon-96.png',
      128: '/icon-128.png',
    },
  },
});
```

## Permissions

[Permissions](https://developer.chrome.com/docs/extensions/reference/permissions/) must be listed in the manifest config.

```ts
export default defineConfig({
  manifest: {
    permissions: ['storage', 'tabs'],
  },
});
```

## Localization

Similar to the icon, the [`_locales` directory](https://developer.chrome.com/docs/extensions/reference/i18n/) should be placed inside the the WXT's [`public` directory](/get-started/assets#public-directory).

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
