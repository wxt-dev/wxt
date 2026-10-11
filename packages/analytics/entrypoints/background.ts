import { defineBackground } from 'wxt/utils/define-background';
import { browser } from '@wxt-dev/browser';

export default defineBackground(() => {
  // Used by the popup to test automatic error tracking in the background
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (message === 'throw-error') {
      setTimeout(() => {
        throw new Error('Unhandled background error (test)');
      });
    } else if (message === 'reject-promise') {
      void Promise.reject(new Error('Unhandled background rejection (test)'));
    }
  });
});
