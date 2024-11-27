export default defineContentScript({
  // Site that uses HTML5 history
  matches: ['*://*.crunchyroll.com/*'],
  exclude: ['firefox'],

  main(ctx) {
    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl, oldUrl }) => {
      console.log('Location changed:', newUrl.href, oldUrl.href);
    });
    console.log('Watching for location change...');
  },
});
