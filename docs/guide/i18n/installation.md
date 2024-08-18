# Installation

[[toc]]

### With WXT

1. Install `@wxt-dev/i18n` via your package manager:

   ```sh
   pnpm i @wxt-dev/i18n
   ```

2. Add the WXT module to your `wxt.config.ts` file and setup a default locale:

   ```ts
   export default defineConfig({
     modules: ['@wxt-dev/i18n/module'],
     manifest: {
       default_locale: 'en',
     },
   });
   ```

3. Create a localization file at `<srcDir>/locales/<default_locale>.yml` or move your existing localization files there.

   ```yml
   # <srcDir>/locales/en.yml
   helloWorld: Hello world!
   ```

   :::tip
   `@wxt-dev/i18n` supports the standard messages format, so if you already have localization files at `<srcDir>/public/_locale/<lang>/messages.json`, you don't need to convert them to YAML or refactor them - just move them to `<srcDir>/locales/<lang>.json` and they'll just work out of the box!
   :::

4. To get a translation, use the auto-imported `i18n` object or import it manually:

   ```ts
   import { i18n } from '#i18n';

   i18n.t('helloWorld'); // "Hello world!"
   ```

And you're done! Using WXT, you get type-safety out of the box.

### Without WXT

1. Install `@wxt-dev/i18n` via your package manager:

   ```sh
   pnpm i @wxt-dev/i18n
   ```

2. Create a messages file at `_locales/<lang>/messages.json` or move your existing translations there:

   ```json
   {
     "helloWorld": {
       "message": "Hello world!"
     }
   }
   ```

   :::info
   For the best DX, you should to integrate `@wxt-dev/i18n` into your build process. This enables:

   1. Plural forms
   2. Simple messages file format
   3. Type safety

   See [Build Integrations](./build-integrations) to set it up.
   :::

3. Create the `i18n` object, export it, and use it wherever you want!

   ```ts
   import { createI18n } from '@wxt-dev/i18n';

   export const i18n = createI18n();

   i18n.t('helloWorld'); // "Hello world!";
   ```
