export default defineContentScript({
  matches: ['*://*.google.com/*'],
  runAt: 'document_start',
  main() {
    coneole.log('Hello content.');
  },
});
