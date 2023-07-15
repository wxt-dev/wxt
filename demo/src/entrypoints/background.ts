export default defineBackground(() => {
  console.log(browser.runtime.id);
  logId();
  console.log({
    browser: __BROWSER__,
    chrome: __IS_CHROME__,
    firefox: __IS_FIREFOX__,
    manifestVersion: __MANIFEST_VERSION__,
  });
});
