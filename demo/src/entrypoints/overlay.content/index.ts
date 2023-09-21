import '../../common/style.css';

export default defineContentScript({
  matches: ['*://*/*'],
  async main(ctx) {
    console.log(browser.runtime.id);
    logId();
    const n = (Math.random() * 100).toFixed(1);
    ctx.setInterval(() => {
      console.log(n, browser.runtime.id);
    }, 1e3);
    mountContentScriptUi();
  },
});
