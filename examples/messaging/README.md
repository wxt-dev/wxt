# Messaging Example

Example of how to send and recieve messages in a WXT extension. It includes 3 different methods of sending one-time requests.

For more messaging examples, see Chrome's documentation: https://developer.chrome.com/docs/extensions/mv3/messaging/

## Extension API

You can use the `browser.runtime.sendMessage` and `browser.runtime.onMessage` APIs to send and recieve messages between the different JS contexts of your extension.

1. In your `entrypoints/background.ts`, use `browser.runtime.onMessage.addListener` to listen for incoming messages.

2. In your `entrypoints/popup/main.ts`, send a message to the background with `browser.runtime.sendMessage`, and display the response on the UI

## `@webext-core/messaging`

This library provides a small abstraction on top of the basic extension APIs, adding type safety.

## `@webext-core/proxy-service`

Another library, with a much higher-level abstraction around messaging. Call methods from one JS context, and execute them in a separate.
