import { defineBackgroundScript } from 'exvite/client';
import browser from 'webextension-polyfill';

export default defineBackgroundScript(() => {
  console.log(browser.runtime.id);
});
