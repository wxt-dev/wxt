import '../../common/style.css';

export default defineContentScript({
  matches: ['*://*/*'],
  async main() {
    const id = Math.random().toString(32).substring(3);
    console.log(id, 2, browser.runtime.id);
    // logId();
    // mountContentScriptUi();
  },
});
