# Testing

## Official Frameworks

WXT officially supports [Vitest](https://vitest.dev/) for unit tests and either [Playwright](https://playwright.dev/) or [Puppeteer](https://pptr.dev/) for E2E tests against Chromium browsers.

For details setting up each testing framework, see the official examples:

<ExampleList tag="testing" />

## Unofficial Frameworks

Puppeteer and Playwright are the only E2E test runners that support Chrome Extensions. There are no other options at the time of writing.

There are other options for unit tests however, like [Jest](https://jestjs.io/), [Mocha](https://mochajs.org/), or [`node:test`](https://nodejs.org/api/test.html). **_WXT does not claim to support any of them_** because none of them support all of WXT's features, like TypeScript or auto-imports.

If you want to try to use a different framework for unit tests, you will need to configure the environment manually:

- **Auto-imports**: Add `unimport` to your test environment or disable them by setting `imports: false` in your `wxt.config.ts` file
- **`browser` mock**: Mock the `webextension-polyfill` module globally with `wxt/dist/virtual/mock-browser.js`
- **[Remote Code Bundling](/guide/further-reading/remote-code)**: If you use it, configure your environment to handle the `url:` module prefix
- **Global Variables**: If you consume them, manually define globals provided by WXT (like `import.meta.env.BROWSER`) by adding them to the global scope before accessing them (`import.meta.env.BROWSER = "chrome"`)
- **Import paths**: If you use the `@/` or `~/` path aliases, add them to your test environment

[Here's how Vitest is configured](https://github.com/wxt-dev/wxt/blob/main/packages/wxt/src/testing/wxt-vitest-plugin.ts) for reference.
