export default defineContentScript({
  matches: ['*://*.google.com/*'],

  async main() {
    console.log('Injecting...');
    await injectScript('/unlisted.js', {
      keepInDom: true,
    });
    console.log('After injection');
  },
});
