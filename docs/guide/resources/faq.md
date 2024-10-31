---
outline: false
---

# FAQ

Commonly asked questions about how to use WXT or why it behaves the way it does.

[[toc]]

---

### Why are content scripts not showing up in the manifest?

During development, WXT registers content scripts dynamically so they can be reloaded individually when a file is saved without reloading your entire extension.

To list the content scripts registered during development, open the service worker's console and run:

```js
await chrome.scripting.getRegisteredContentScripts();
```
