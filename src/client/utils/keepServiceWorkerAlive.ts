import browser from 'webextension-polyfill';

/**
 * // https://developer.chrome.com/blog/longer-esw-lifetimes/
 */
export function keepServiceWorkerAlive() {
  setInterval(async () => {
    // Calling an async browser API resets the service worker's timeout
    await browser.runtime.getPlatformInfo();
  }, 5e3);
}
