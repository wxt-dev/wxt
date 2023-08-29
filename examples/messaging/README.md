# Messaging Example

Example of how to send and recieve messages in a WXT extension. It includes 3 different methods of sending one-time requests.

## Extension API

You can use the `browser.runtime.sendMessage` and `browser.runtime.onMessage` APIs to send and recieve messages between the different JS contexts of your extension.

1. In `entrypoints/background.ts`, use `browser.runtime.onMessage.addListener` to listen for incoming messages.

2. In `entrypoints/popup/main.ts`, send a message to the background with `browser.runtime.sendMessage`, and display the response on the UI

For more messaging examples, see [Chrome's docs](https://developer.chrome.com/docs/extensions/mv3/messaging/).

## `@webext-core/messaging`

This library provides a small abstraction on top of the basic extension APIs, adding type safety.

1. Define and export type-safe messaging utils from `utils/messaging.ts`

2. In `entrypoints/background.ts`, call `onMessage` to listen for incoming messages for "getStringLength"

3. In `entrypoints/popup/main.ts`, use `sendMessage` to send a "getStringLength" message.

See [`@webext-core`'s docs](https://webext-core.aklinker1.io/guide/messaging/) for more details.

## `@webext-core/proxy-service`

Another library, with a much higher-level abstraction around messaging. Call methods from one JS context, and execute them in a separate.

1. A "proxy service" is defined in `utils/math-service.ts`, where the `fibbonacci` function is implemented.

2. In `entrypoints/background.ts`, call `registerMathService`.

3. In `entrypoints/popup/main.ts`, use `getMathService` to get an async version of your math service implementation, and simply call `await mathService.fibbonacci(...)` to run the function in the background.

See [`@webext-core`'s docs](https://webext-core.aklinker1.io/guide/proxy-service/) for more details.
