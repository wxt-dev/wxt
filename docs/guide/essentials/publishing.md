---
outline: deep
---

# Publishing

WXT can ZIP your extension and submit it to various stores for review or for self-hosting.

## First Time Publishing

If you're publishing an extension to a store for the first time, you must manually navigate the process. WXT doesn't help you create listings, each store has unique steps and requirements that you need to familiarize yourself with.

For specific details about each store, see the stores sections below.

- [Chrome Web Store](#chrome-web-store)
- [Firefox Addon Store](#firefox-addon-store)
- [Edge Addons](#edge-addons)

## Automation

WXT provides two commands to help automate submitting a new version for review and publishing:

- `wxt submit init`: Setup all the required secrets and options for the `wxt submit` command
- `wxt submit`: Submit new versions of your extension for review (and publish them automatically once approved)

To get started, run `wxt submit init` and follow the prompts, or run `wxt submit --help` to view all available options. Once finished, you should have a `.env.submit` file! WXT will use this file to submit your updates.

> In CI, make sure you add all the environment variables to the submit step.

To submit a new version for publishing, build all the ZIPs you plan on releasing:

```sh
wxt zip
wxt zip -b firefox
```

Then run the `wxt submit` command, passing in all the ZIP files you want to release. In this case, we'll do a release for all 3 major stores: Chrome Web Store, Edge Addons, and Firefox Addons Store.

If it's your first time running the command or you recently made changes to the release process, you'll want to test your secrets by passing the `--dry-run` flag.

```sh
wxt submit --dry-run \
  --chrome-zip .output/{your-extension}-{version}-chrome.zip \
  --firefox-zip .output/{your-extension}-{version}-firefox.zip --firefox-sources-zip .output/{your-extension}-{version}-sources.zip \
  --edge-zip .output/{your-extension}-{version}-chrome.zip
```

If the dry run passes, remove the flag and do the actual release:

```sh
wxt submit \
  --chrome-zip .output/{your-extension}-{version}-chrome.zip \
  --firefox-zip .output/{your-extension}-{version}-firefox.zip --firefox-sources-zip .output/{your-extension}-{version}-sources.zip \
  --edge-zip .output/{your-extension}-{version}-chrome.zip
```

:::warning
See the [Firefox Addon Store](#firefox-addon-store) section for more details about the `--firefox-sources-zip` option.
:::

## GitHub Action

Here's an example of a GitHub Action that submits new versions of an extension for review. Ensure that you've added all required secrets used in the workflow to the repo's settings.

```yml
name: Release

on:
  workflow_dispatch:

jobs:
  submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Zip extensions
        run: |
          pnpm zip
          pnpm zip:firefox

      - name: Submit to stores
        run: |
          pnpm wxt submit \
            --chrome-zip .output/*-chrome.zip \
            --firefox-zip .output/*-firefox.zip --firefox-sources-zip .output/*-sources.zip
        env:
          CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
          CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
          CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
          CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
          FIREFOX_EXTENSION_ID: ${{ secrets.FIREFOX_EXTENSION_ID }}
          FIREFOX_JWT_ISSUER: ${{ secrets.FIREFOX_JWT_ISSUER }}
          FIREFOX_JWT_SECRET: ${{ secrets.FIREFOX_JWT_SECRET }}
```

The action above lays the foundation for a basic workflow, including `zip` and `submit` steps. To further enhance your GitHub Action and delve into more complex scenarios, consider exploring the following examples from real projects. They introduce advanced features such as version management, changelog generation, and GitHub releases, tailored for different needs:

- [`aklinker1/github-better-line-counts`](https://github.com/aklinker1/github-better-line-counts/blob/main/.github/workflows/submit.yml) - Conventional commits, automated version bump and changelog generation, triggered manually, optional dry run for testing
- [`GuiEpi/plex-skipper`](https://github.com/GuiEpi/plex-skipper/blob/main/.github/workflows/deploy.yml) - Triggered automatically when `package.json` version is changed, creates and uploads artifacts to GitHub release.

> These examples are designed to provide clear insights and are a good starting point for customizing your own workflows. Feel free to explore and adapt them to your project needs.

## Stores

### Chrome Web Store

> ✅ Supported &bull; [Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) &bull; [Publishing Docs](https://developer.chrome.com/docs/webstore/publish/)

To create a ZIP for Chrome:

```sh
wxt zip
```

### Firefox Addon Store

> ✅ Supported &bull; [Developer Dashboard](https://addons.mozilla.org/developers/) &bull; [Publishing Docs](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)

Firefox requires you to upload a ZIP of your source code. This allows them to rebuild your extension and review the code in a readable way. More details can be found in [Firefox's docs](https://extensionworkshop.com/documentation/publish/source-code-submission/).

When running `wxt zip -b firefox`, WXT will zip both your extension and sources. Certain files (such as config files, hidden files, tests, and excluded entrypoints) are automatically excluded from your sources. However, it's important to manually check the ZIP to ensure it only contains the files necessary to rebuild your extension.

To customize which files are zipped, add the `zip` option to your config file.

```ts [wxt.config.ts]
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

```sh [bun]
bun i
bun zip:firefox
```

:::

Ensure that you have a `README.md` or `SOURCE_CODE_REVIEW.md` file with the above commands so that the Firefox team knows how to build your extension.

Make sure the build output is the exact same when running `wxt build -b firefox` in your main project and inside the zipped sources.

:::warning
If you use a `.env` files, they can affect the chunk hashes in the output directory. Either delete the .env file before running `wxt zip -b firefox`, or include it in your sources zip with the [`zip.includeSources`](/api/reference/wxt/interfaces/InlineConfig#includesources) option. Be careful to not include any secrets in your `.env` files.

See Issue [#377](https://github.com/wxt-dev/wxt/issues/377) for more details.
:::

#### Private Packages

If you use private packages and you don't want to provide your auth token to the Firefox team during the review process, you can use `zip.downloadPackages` to download any private packages and include them in the zip.

```ts [wxt.config.ts]
export default defineConfig({
  zip: {
    downloadPackages: [
      '@mycompany/some-package',
      //...
    ],
  },
});
```

Depending on your package manager, the `package.json` in the sources zip will be modified to use the downloaded dependencies via the `overrides` or `resolutions` field.

:::warning
WXT uses the command `npm pack <package-name>` to download the package. That means regardless of your package manager, you need to properly setup a `.npmrc` file. NPM and PNPM both respect `.npmrc` files, but Yarn and Bun have their own ways of authorizing private registries, so you'll need to add a `.npmrc` file.
:::

### Safari

> 🚧 Not supported yet

WXT does not currently support automated publishing for Safari. Safari extensions require a native MacOS or iOS app wrapper, which WXT does not create yet. For now, if you want to publish to Safari, follow this guide:

- [Converting a web extension for Safari](https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari) - "Convert your existing extension to a Safari web extension using Xcode’s command-line tool."

When running the `safari-web-extension-converter` CLI tool, pass the `.output/safari-mv2` or `.output/safari-mv3` directory, not your source code directory.

```sh
pnpm wxt build -b safari
xcrun safari-web-extension-converter .output/safari-mv2
```

### Edge Addons

> ✅ Supported &bull; [Developer Dashboard](https://aka.ms/PartnerCenterLogin) &bull; [Publishing Docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension)

No need to create a specific ZIP for Edge. If you're already publishing to the Chrome Web Store, you can reuse your Chrome ZIP.

However, if you have features specifically for Edge, create a separate ZIP with:

```sh
wxt zip -b edge
```
