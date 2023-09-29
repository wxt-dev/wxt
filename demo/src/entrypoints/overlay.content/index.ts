import '../../common/style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main(ctx) {
    console.log(browser.runtime.id);
    logId();

    console.log('WXT MODE:', import.meta.env.MODE);

    const n = (Math.random() * 100).toFixed(1);
    ctx.setInterval(() => {
      console.log(n, browser.runtime.id);
    }, 1e3);

    mountContentScriptUi();
  },
});
