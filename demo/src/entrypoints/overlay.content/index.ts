import '../../common/style.css';

export default defineContentScript({
  matches: ['*://*/*'],
  async main() {
    console.log(browser.runtime.id);

    mountContentScriptUi();
  },
});
