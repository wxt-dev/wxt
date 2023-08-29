export default defineBackground(() => {
  // Update installDate
  browser.runtime.onInstalled.addListener(async (event) => {
    if (event.reason === 'install') {
      await browser.storage.local.set({
        installDate: new Date().toISOString(),
      });
    }
  });

  // Update lastStartedAt
  void browser.storage.local.set({ lastStartedAt: new Date().toISOString() });
});
