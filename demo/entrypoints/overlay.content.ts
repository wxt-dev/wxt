import { defineContentScript, mountContentScriptUi } from 'exvite/client';
import browser from 'webextension-polyfill';

export default defineContentScript({
  matches: ['*://*/*'],
  async main() {
    console.log(browser.runtime.id);

    mountContentScriptUi();
  },
});
