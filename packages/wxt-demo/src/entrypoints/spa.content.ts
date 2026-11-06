// Without `spa: true`, this would only run when a watch page is loaded
// directly, not when clicking a video from the homepage.
export default defineContentScript({
  matches: ['*://*.youtube.com/watch*'],
  spa: true,

  main(ctx) {
    const url = location.href;
    console.log('[spa] main called for', url);
    ctx.onInvalidated(() => console.log('[spa] context aborted for', url));
  },
});
