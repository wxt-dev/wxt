# Introduction

:::info
You don't have to use `wxt` to use this package - it will work in any bundler setup. See [Installation without WXT](./installation#without-wxt) for more details.
:::

`@wxt-dev/i18n` is a simple, type-safe wrapper around the `browser.i18n` APIs. It provides several benefits over the standard API:

1. Simple messages file format
2. Plural form support
3. Integrates with the [I18n Ally VS Code extension](./editor-support#vscode)

It also provides several benefits over other non-web extension specific i18n packages:

1. Does not bundle localization files into every entrypoint
2. Don't need to fetch the localization files asyncronously
3. Can localize extension name in manifest
4. Can access localized strings inside CSS files

However, it does have one major downside:

1. Like the `browser.i18n` API, to change the language, users must change the browser's language
