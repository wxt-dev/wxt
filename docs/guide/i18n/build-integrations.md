# Build Integrations

To use the custom messages file format, you'll need to use `@wxt-dev/i18n/build` to transform the custom format to the one expected by browsers.

Here's a list of build tools that already have an integration:

[[toc]]

:::info
If you want to contribute, please do! In particular, an `unplugin` integration would be awesome!
:::

## WXT

See [Installation with WXT](./installation#with-wxt).

But TLDR, all you need is:

```ts
// wxt.config.ts
export default defineConfig({
  modules: ['@wxt-dev/i18n/module'],
});
```

Types are generated whenever you run `wxt prepare` or another build command:

```sh
wxt prepare
wxt
wxt build
wxt zip
# etc
```

## Custom

If you're not using WXT, you'll have to pre-process the localization files yourself. Here's a basic script to generate the `_locales/.../messages.json` and `wxt-i18n-structure.d.ts` files:

```ts
// build-i18n.js
import {
  parseMessagesFile,
  generateChromeMessagesFile,
  generateTypeFile,
} from '@wxt-dev/i18n/build';

// Read your localization files
const messages = {
  en: await parseMessagesFile('path/locales/en.yml'),
  de: await parseMessagesFile('path/locales/de.yml'),
  // ...
};

// Generate JSON files for the browser
await generateChromeMessagesFile('dist/_locales/en/messages.json', messages.en);
await generateChromeMessagesFile('dist/_locales/de/messages.json', messages.de);
// ...

// Generate a types file based on your default_locale
await generateTypeFile('wxt-i18n-structure.d.ts', messages.en);
```

Then run the script:

```sh
node generate-i18n.js
```

If your build tool has a dev mode, you'll also want to rerun the script whenever you change a localization file.

### Type Safety

Once you've generated `wxt-i18n-structure.d.ts` (see the [Custom](#custom) section), you can use it to pass the generated type into `createI18n`:

```ts
import type { WxtI18nStructure } from './wxt-i18n-structure';

export const i18n = createI18n<WxtI18nStructure>();
```

And just like that, you have type safety!
