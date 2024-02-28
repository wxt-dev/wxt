export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main() {
    coneole.log('Hello content.');
  },
});
