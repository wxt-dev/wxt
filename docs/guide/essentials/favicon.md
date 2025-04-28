# Favicons

[How to fetch favicons](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)

## What happens when you add favicons permissions in wxt.config.ts?

WXT automatically adds value in web_accessible_resources with default and updates the types for favicons

This is automatically added in manifest.json

```js
"web_accessible_resources": [
    {
      "resources": ["_favicon/*"],
      "matches": [],
    }
  ]

```

## If you want to add custom values in `matches` parameter you can either add by hook or [WXT Modules](https://wxt.dev/guide/essentials/wxt-modules.html#wxt-modules).

1. Via hook in wxt.config.ts

```js

import { defineConfig } from "wxt";
// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  hooks: {
    "build:manifestGenerated": (_, manifest) => {
      const favicon_resource: any = manifest.web_accessible_resources?.find(
        (resource: any) => resource.includes("favicon")
      );
      favicon_resource.matches?.push("<all_urls>");
      manifest.web_accessible_resources ??= [];
      manifest.web_accessible_resources?.push(favicon_resource);
    },
  },
});

```

2. Via module

```js

import { defineWxtModule } from "wxt/modules";

export default defineWxtModule({
  setup(wxt) {
    wxt.hooks.hook("build:manifestGenerated", (_, manifest) => {
      const favicon_resource: any = manifest.web_accessible_resources?.find(
        (resource: any) => resource.includes("favicon")
      );
      favicon_resource.matches?.push("<all_urls>");
      manifest.web_accessible_resources ??= [];
      manifest.web_accessible_resources?.push(favicon_resource);
    });
  },
});
```
