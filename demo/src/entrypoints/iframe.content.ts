export default defineContentScript({
  // matches: ['*://*.google.com/*'],

  main(ctx) {
    const ui = createIframeUi(ctx, {
      page: '/iframe-src.html',
      position: 'overlay',
      anchor: 'form[action="/search"]',
    });
    ui.mount();
    console.log('Mounted iframe');
  },
});
