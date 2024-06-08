# `web-ext.config.ts`

This file lets you configure the browser startup when running `wxt dev`.

```ts
import { defineRunnerConfig } from 'wxt';

export default defineRunnerConfig({
  startUrls: ['https://google.com', 'https://youtube.com'],
});
```

There are three places you can customize the runner:

- `<root>/wxt.config.ts` - Use the `runner` option. Changes here will be committed and shared with everyone developing the project.
- `<root>/web-ext.config.ts` - A gitignored file for you to customize the startup behavior to your liking without effecting others
- `$HOME/web-ext.config.ts` - Stores system-wide config effecting all projects running on your machine.

See below examples on how to accomplish common configuration:

[[toc]]

## Configuring Binaries

`web-ext`'s browser discovery is very limited. By default, it only guesses at where Chrome and Firefox are installed. If you've customized your install locations, you may need to tell `web-ext` where the binaries/executables are located using the [`binaries` option](/api/reference/wxt/interfaces/ExtensionRunnerConfig#binaries). For other Chromium based browsers, like Edge or Opera, you'll need to explicitly list them in the `binaries` option as well, otherwise they will open in Chrome by default.

```ts
import { defineRunnerConfig } from 'wxt';

export default defineRunnerConfig({
  binaries: {
    chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
    firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
    edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
  },
});
```

## Disable Opening Browser

Disabling the browser can be useful if it's difficult to develop your extension with fresh profiles. Maybe you need to sign into a website to see a content script run, and a fresh profile isn't helpful because it doesn't save your login info.

To disable opening the extension automatically in a new window, just disable the runner:

```ts
export default defineRunnerConfig({
  disabled: true,
});
```

## Profile Customization

Another option, instead of disabling the runner, to stay logged into websites is to use a custom profile.

`web-ext` comes with some built-in ways of using an existing profile, but it's not really using the same profile. It copies the profile to a temp directory, and uses that.

Instead, I've found it's better to pass Chrome's `--user-data-dir` argument. This let's you use a fresh profile initially, and customize it to your liking. You can install devtool extensions, set custom flags, and log into websites. Next time you run the extension in dev mode, all that will be remembered!

```ts
export default defineRunnerConfig({
  chromiumArgs: ['--user-data-dir=./chrome-data'],
});
```

> This only works for Chrome. You'll have to use `firefoxProfile` option instead, which has the same limitations mentioned above, where you won't be signed into websites automatically.
