# I18n Example

This directory contains a project with the basic setup required for localizing a web extension.

1. `public/_locales/*/messages.json` include the JSON files holding all your translations.

2. `wxt.config.ts` override the manifest's `name` and `description` fields (which are normally pulled from your `package.json`) to be read from your `messages.json`

3. `wxt.config.ts` also defines the manifest's `default_locale`, in this case, `"en"`.

4. `entrypoints/background.ts` demonstrates how to use the `browser.i18n.getMessage` API to load a translation in the service worker

5. `entrypoints/popup/main.ts` shows off one way of localizing your HTML files, as well as using a predefined message, `@@ui_locale`.

For more information, see Chrome's overview for localization: https://developer.chrome.com/docs/extensions/reference/i18n/
