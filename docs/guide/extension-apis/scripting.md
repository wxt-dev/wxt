# `browser.scripting`

[Chrome Docs](https://developer.chrome.com/docs/extensions/reference/api/scripting) &bull; [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting)

Refer to the browser docs above for basics on how the API works.

## Execute Script Return Values

When using `browser.scripting.executeScript`, you can execute content scripts or unlisted scripts. To return a value, just return a value from the script's main function.

```ts
// entrypoints/background.ts
const res = await browser.scripting.executeScript({
  target: { tabId },
  files: ['injected.js'],
});
console.log(res); // "Hello John!"
```

```ts
// entrypoints/injected.js
export default defineContentScript(() => {
  console.log('Script was injected!');
  return 'Hello John!';
});
```
