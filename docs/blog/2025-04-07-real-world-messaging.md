---
layout: blog
title: Real World Messaging
description: |
  Let's go beyond the simple examples from Chrome and Firefox's documentation to build a simple messaging system for our web extension from scratch.
authors:
  - name: Aaron Klinker
    github: aklinker1
date: 2025-04-07T15:32:45.919Z
---

TOC?

- One-time message passing
- Long-lived connections
- External messaging
- Error handling
- Listeners not setup yet - backoff/retry?

# Real World Messaging

Chrome and Firefox's message passing documentation is short and simple. Perhaps too short, too simple. In this post, we'll dive a bit deeper into how to use the messaging APIs in a real extensions, avoid common pitfalls, then build out a full message passing system, similar to `webext-bridge`.

## One-time Message Passing Pitfalls

When building extensions, you often need to send a message from the popup to your background. Chrome and Firefox's documentation will rightly recommend you use one-time message passing for this:

```ts [Popup]
const tab = await browser.runtime.sendMessage('get-active-tab');
```

```ts [Background]
browser.runtime.onMessage.addListener((_message, _sender, sendResponse) => {
  browser.tabs.query({ focusedWindow: true, active: true }).then((tabs) => {
    sendResponse(tabs[0]);
  });
  return true;
});
```

To send a value back to the popup, you have two options:

1. Return `true` and call the `sendResponse` argument sometime in the future (as shown above)
2. Return a `Promise` of the value you want to send

From here on out, we'll use the promise-based responses because the code is easier to read:

```ts [Background]
browser.runtime.onMessage.addListener(async () => {
  const tabs = await browser.tabs.query({ focusedWindow: true, active: true });
  return tabs[0];
});
```

Perfect! This is well documented in Google and Mozilla's messaging guides.

But we've already fallen into a common pitfall... This code will only work for one `onMessage` listener. As your extension grows, you or packages you use may setup additional `onMessage` listeners.

For example, lets say our extension needs to be able to reload a tab. In an event based system like extensions use, it's natural to add another listener in the background to handle this:

```ts [Popup]
const tab = await browser.runtime.sendMessage('get-active-tab'); // [!code --]
const tab = await browser.runtime.sendMessage({ type: 'get-active-tab' }); // [!code ++]
await browser.runtime.sendMessage({ type: 'refresh-tab', tabId: tab.id }); // [!code ++]
```

<!-- prettier-ignore -->
```ts [Background]
browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "get-active-tab") { // [!code ++]
    const tabs = await browser.tabs.query({ focusedWindow: true, active: true });
    return tabs[0];
  } // [!code ++]
});

browser.runtime.onMessage.addListener(async (message) => { // [!code ++]
  if (message.type === "reload-tab") { // [!code ++]
    const tab = await browser.tabs.get(message.tabId); // [!code ++]
    await tabs.reload(); // [!code ++]
  } // [!code ++]
}); // [!code ++]
```

At a glance, this code looks fine! When you have two listeners, the sender will receive the first response sent back to it. Since we're using an if-statement in each listener to only respond to a specific message type, we're good... right?

Wrong. Here's the biggest pitfall of messaging: `async` functions always return a promise, even if they don't `await` anything.

That means when the popup sends the `get-active-tab` message, there's a race condition:

- The first listener will return a promise containing tab details
- The second listener will return a promise containing `undefined`

Since the second listener will return it's promise immediately without awaiting anything, and the first needs to query tabs, the second listener will always win the race condition. `browser.runtime.sendMessage({ type: 'get-active-tab' })` will always return `undefined`.

Alright... so how do we fix this? It's simple, never mark your message listener as `async`.

```ts
async function getActiveTab(): Promise<Tab | undefined> {
  const tabs = await browser.tabs.query({ focusedWindow: true, active: true });
  return tabs[0];
}
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'get-active-tab') {
    return getActiveTab();
  }
});

async function reloadTab(id: number): Promise<void> {
  const tab = await browser.tabs.get(message.tabId);
  await tabs.reload();
}
browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'reload-tab') {
    // Returning the promise, even `Promise<void>` will ensure `sendMessage`
    // waits for the async work to finish before returning a response.
    return reloadTab();
  }
});
```

This is the correct way to write one-time message listeners that will scale as your extension grows. You can use promises, but never make the listener `async`.

## Error Handling

Another common issue developers run into when sending messages is not properly handling errors. When a handler throws an error before `sendResponse` is called or the returned promise rejects, the sender just receives `undefined`.

Let's write some helper functions to send errors in the response:

```ts
import { serializeError, deserializeError } from 'serialize-error';

type SerializedResponse<T> =
  | { type: 'success'; value: T }
  | { type: 'error'; error: unknown };

function serializeResponse<T>(
  promise: Promise<T>,
): Promise<SerializedResponse<T>> {
  return promise
    .then((value) => ({ type: 'success', value }))
    .catch((err) => ({ type: 'error', error: serializeError(err) }));
}

function deserializeResponse<T>(
  promise: Promise<SerializedResponse<T>>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    promise
      .then((res) => {
        if (res == null) {
          return reject(
            Error(
              "Response was undefined, must be an object like { type: 'success' | 'error' }",
            ),
          );
        } else if (res?.type === 'success') {
          return resolve(res.value);
        } else if (res?.type === 'error') {
          return reject(deserializeError(res.error));
        } else {
          reject(Error('Unknown response type'));
        }
      })
      .catch(reject);
  });
}
```

Then we can use them when we send and receive messages:

```ts [Popup]
const tab = await deserializeResponse(
  browser.runtime.sendMessage({ type: 'get-active-tab' }),
);
```

```ts [Background]
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'get-active-tab') {
    return serializeResponse(getActiveTab());
  }
});
```

## Other Message Transports

Using `browser.runtime.sendMessage` and `browser.runtime.onMessage` is not the only way to send and receive messages. As your extension grows, you'll have to use other APIs for sending and receiving messages. Each "transport" can only send and receive messages for specific places.

| Transport Name             |                                  APIs Used                                  | Background | Extension Pages | Content Scripts | External Webpages | Other Frames | Native Applications |
| -------------------------- | :-------------------------------------------------------------------------: | :--------: | :-------------: | :-------------: | :---------------: | :----------: | :-----------------: |
| Extension Transport        |         `browser.runtime.sendMessage` & `browser.runtime.onMessage`         |            |                 |                 |                   |              |                     |
| Tabs Transport             |          `browser.tabs.sendMessage` & `browser.runtime.onMessage`           |            |                 |                 |                   |              |                     |
| Port Transport             |           `browser.runtime.connect` & `browser.runtime.onConnect`           |            |                 |                 |                   |              |                     |
| Native Transport           |   `browser.runtime.sendNativeMessage` & `browser.runtime.onNativeMessage`   |            |                 |                 |                   |              |                     |
| External Transport         | `browser.runtime.sendExternalMessage` & `browser.runtime.onExternalMessage` |            |                 |                 |                   |              |                     |
| Window Messaging Transport |                  `window.postMessage` & `window.onMessage`                  |            |                 |                 |                   |              |                     |
| Custom Event Transport     |                  `CustomEvent` & `window.addEventListener`                  |            |                 |                 |                   |              |                     |

## Building a Messaging System

If your extension grows large enough, eventually you'll need to start chaining transports together. For example, to send a message from the Popup to a Content Script requires two transports:

1. Popup &rarr; Background: Extension Transport (or Port Transport)
2. Background &rarr; Content Script: Tab Transport (or a separate Port Transport)

Messaging packages like `webext-bridge` combine all these transports together into a single API. When you send a message, you just specify a "target" to send the message to and the messaging system is responsible for delivering the message to the right place and returning a response (if any).

### Unified Transport Interface

The different APIs used by each transport are not uniform. So to simplify things, we'll start by creating an abstraction so they all use the same API:

```ts
type Message = {
  type: string;
  params?: any;
};
type RemoveListenerFn = () => void;

interface Transport<TSendArgs extends any[] = []> {
  sendMessage(message: Message, ...sendArgs: TSendArgs): Promise<any>;
  onMessage(
    type: string,
    cb: (message: Message) => void | Promise<void>,
  ): RemoveListenerFn;
}
```

Then we just need to implement this interface for each transport. I prefer the functional approach, but they could be implemented as classes as well.

:::code-group

```ts [Extension Transport]
export function createExtensionTransport(): Transport {
  return {
    async sendMessage(message) {
      return await browser.runtime.sendMessage(message);
    },

    async onMessage(type, callback) {
      const listener = (message: Message) => {
        if (message.type !== type) return;

        // Once we know the message is the type we're listening for, return a promise.
        return Promise.resolve(callback(message))
          .then((value) => ({ type: 'success', value }))
          .catch((err) => ({ type: 'error', error: serializeError(err) }));
      };

      browser.runtime.onMessage.addListener(listener);
      return () => browse.runtime.onMessage.removeListener(listener);
    },
  };
}
```

```ts [Tabs]
export function createTabsTransport(): Transport<
  [tabId: number | undefined, frameId?: number]
> {
  return {
    ...createExtensionTransport(),
    sendMessage(message, tabId, frameId) {
      browser.tabs.sendMessage(tabId, message, { frameId });
    },
  };
}
```

```ts [Tabs]
export function createTabsTransport(): Transport<
  [tabId: number | undefined, frameId?: number]
> {
  return {
    ...createExtensionTransport(),
    sendMessage(message, tabId, frameId) {
      browser.tabs.sendMessage(tabId, message, { frameId });
    },
  };
}
```

:::
