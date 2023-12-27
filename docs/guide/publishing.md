# Publishing

WXT offers several utilities that simplify the publishing process.

## First Time Publishing

If you're publishing an extension to a store for the first time, you must manually navigate the process. Each store has unique steps and requirements that you need to familiarize yourself with.

Each store requires that a ZIP file be uploaded. You can generate these using the `wxt zip` command:

```sh
wxt zip
wxt zip -b firefox
# etc
```

Generated ZIP files are stored in the `.output` directory.

## Automation

To automate releasing updates, use the [`publish-browser-extension`](https://www.npmjs.com/package/publish-browser-extension) package.

:::info
🚧 WXT plans to eventually incorporate the `publish-browser-extension` package into its own `wxt submit` command.
:::

1. Install the necessary dependencies:

   ```sh
   pnpm add -D publish-browser-extension env-cmd
   ```

2. Add scripts to your `package.json` file:

   ```json
   {
     "scripts": {
       "submit": "env-cmd -f .env.submit -- publish-extension",
       "submit:dry": "env-cmd -f .env.submit -- publish-extension --dry-run"
     }
   }
   ```

3. Create a `.env.submit` file and include the code below. If you're not publishing to certain stores, simply ignore their respective variables.

   ```txt
   CHROME_EXTENSION_ID=""
   CHROME_CLIENT_ID=""
   CHROME_CLIENT_SECRET=""
   CHROME_REFRESH_TOKEN=""

   FIREFOX_EXTENSION_ID=""
   FIREFOX_JWT_ISSUER=""
   FIREFOX_JWT_SECRET=""

   EDGE_PRODUCT_ID=""
   EDGE_CLIENT_ID=""
   EDGE_CLIENT_SECRET=""
   EDGE_ACCESS_TOKEN_URL=""
   ```

   > Each value will be filled in during the next step.

4. Run `npx publish-extension --help` for assistance with filling out all the values. Insert the obtained values within the double quotes.

5. ZIP all the targets you plan to publish, in this case Chrome and Firefox.

   ```sh
   wxt zip
   wxt zip -b firefox
   ```

6. Test your credentials by running the `submit:dry` command:

   ```sh
   pnpm submit:dry \
     --chrome-zip .output/your-extension-X.Y.Z-chrome.zip \
     --firefox-zip .output/your-extension-X.Y.Z-firefox.zip \
     --firefox-sources-zip .output/your-extension-X.Y.Z-sources.zip \
     --edge-zip .output/your-extension-X.Y.Z-chrome.zip
   ```

7. Upload and submit your extension for review:

   ```sh
   pnpm submit \
     --chrome-zip .output/your-extension-X.Y.Z-chrome.zip \
     --firefox-zip .output/your-extension-X.Y.Z-firefox.zip \
     --firefox-sources-zip .output/your-extension-X.Y.Z-sources.zip \
     --edge-zip .output/your-extension-X.Y.Z-chrome.zip
   ```

## GitHub Action

Here's an example of a GitHub Action to automate submiting new versions of your extension for review. Ensure that you've added all required secrets used in the workflow to the repo's settings.

```yml
# TODO
```

## Chrome Web Store

✅ Automated &bull; [Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) &bull; [Publishing Docs](https://developer.chrome.com/docs/webstore/publish/)

To create a ZIP for Chrome:

```sh
wxt zip
```

## Firefox Addon Store

✅ Automated &bull; [Developer Dashboard](https://addons.mozilla.org/developers/) &bull; [Publishing Docs](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)

Firefox requires you to upload a ZIP of your source code. This allows them to rebuild your extension and review the code in a readable way. More details can be found in [Firefox's docs](https://extensionworkshop.com/documentation/publish/source-code-submission/).

WXT and `publish-browser-extension` both fully support generating and automatically submitting a source code ZIP.

When you run `wxt zip -b firefox`, your sources are zipped into the `.output` directory along with your built extension. WXT is configured to exclude certain files such as config files, hidden files, and tests. However, it's important to manually check the ZIP to ensure it only contains the files necessary to rebuild your extension.

To customize which files are zipped, add the `zip` option to your config file.

```ts
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  zip: {
    // ...
  },
});
```

If it's your first time submitting to the Firefox Addon Store, or if you've updated your project layout, always test your sources ZIP! The commands below should allow you to rebuild your extension from inside the extracted ZIP.

:::code-group

```sh [pnpm]
pnpm i
pnpm zip:firefox
```

```sh [npm]
npm i
npm run zip:firefox
```

```sh [yarn]
yarn
yarn zip:firefox
```

:::

Ensure that you have a `README.md` or `SOURCE_CODE_REVIEW.md` file with the above commands so that the Firefox team knows how to build your extension.

## Safari

🚧 Not automated at this time

:::warning
🚧 WXT does not currently support automated publishing for Safari. Safari extensions require a native MacOS or iOS app wrapper, which WXT cannot create at this time. For now, if you want to publish to Safari, follow this guide:

https://developer.apple.com/documentation/safariservices/safari_web_extensions/distributing_your_safari_web_extension

:::

## Edge Addons

✅ Automated &bull; [Developer Dashboard](https://aka.ms/PartnerCenterLogin) &bull; [Publishing Docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension)

No need to create a specific ZIP for Edge. If you're already publishing to the Chrome Web Store, you can reuse your Chrome ZIP.

However, if you have features specifically for Edge, create a separate ZIP with:

```sh
wxt zip -b edge
```
