# Scripting

[Chrome Docs](https://developer.chrome.com/docs/extensions/reference/api/scripting) • [Firefox Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting)

Refer to the browser docs above for basics on how the API works.

## Execute Script Return Values

When using `browser.scripting.executeScript`, you can execute content scripts or unlisted scripts. To return a value, just return a value from the script's `main` function.

```ts
// entrypoints/background.ts
const res = await browser.scripting.executeScript({
  target: { tabId },
  files: ['content-scripts/example.js'],
});
console.log(res); // "Hello John!"
```

```ts
// entrypoints/example.content.ts
export default defineContentScript({
  registration: 'runtime',
  main(ctx) {
    console.log('Script was injected!');
    return 'Hello John!';
  },
});
```
