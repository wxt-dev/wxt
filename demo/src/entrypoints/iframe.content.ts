export default defineContentScript({
  matches: ['*://*.google.com/*'],

  main(ctx) {
    const ui = createContentScriptIframe(ctx, {
      page: '/iframe-src.html',
      type: 'overlay',
      anchor: 'form[action="/search"]',
    });
    ui.mount();
    console.log('Mounted iframe');
  },
});
