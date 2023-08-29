export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main() {
    console.log('Content script without styles');
  },
});
