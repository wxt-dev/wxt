export default defineContentScript({
  matches: ['*://*.example.com/*'],

  async main() {
    console.log(getAppConfig());
    console.log('Injecting...');
    await injectScript('/unlisted.js', {
      keepInDom: true,
    });
    console.log('After injection');
  },
});
