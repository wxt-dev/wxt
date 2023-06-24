export default defineBackgroundScript(() => {
  console.log(browser.runtime.id);
  logId();
  console.log({
    browser: __BROWSER__,
    chromium: __IS_CHROMIUM__,
    firefox: __IS_FIREFOX__,
    manifestVersion: __MANIFEST_VERSION__,
  });
});
