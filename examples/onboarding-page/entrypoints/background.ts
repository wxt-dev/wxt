export default defineBackground(() => {
  // Open onboarding on install
  browser.runtime.onInstalled.addListener(async (event) => {
    if (event.reason === 'install') {
      await browser.tabs.create({
        url: browser.runtime.getURL('/onboarding.html'),
      });
    }
  });
});
