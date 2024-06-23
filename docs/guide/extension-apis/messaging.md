# Messaging

## Overview

Follow [Chrome's message passing guide](https://developer.chrome.com/docs/extensions/mv3/messaging/) to understand how message passing works in web extensions. In Google's examples, just replace `chrome` with `browser`, and it will work in WXT.

Here's a basic request/response example:

```ts
// popup/main.ts
const res = await browser.runtime.sendMessage('ping');

console.log(res); // "pong"
```

```ts
// background.ts
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message); // "ping"

    // Wait 1 second and respond with "pong"
    setTimeout(() => sendResponse('pong'), 1000);
    return true;
  });
});
```

## Third Party Libraries

There are a number of message passing libraries you can use to improve the message passing experience.

- [`@webext-core/messaging`](https://webext-core.aklinker1.io/guide/messaging/) - "A light-weight, type-safe wrapper around the `browser.runtime` messaging APIs"
- [`@webext-core/proxy-service`](https://webext-core.aklinker1.io/guide/proxy-service/) - "Create RPC-like services that can be called from anywhere but run in the background"
- [`webext-bridge`](https://github.com/zikaari/webext-bridge) - "Messaging in Web Extensions made super easy. Out of the box."
- [`trpc-chrome`](https://www.npmjs.com/package/trpc-chrome) - "tRPC adapter for Web Extensions 🧩"
