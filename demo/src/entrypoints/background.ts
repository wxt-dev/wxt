export default defineBackground(() => {
  console.log(browser.runtime.id);
  logId();
  console.log({
    browser: __BROWSER__,
    chrome: __IS_CHROME__,
    firefox: __IS_FIREFOX__,
    manifestVersion: __MANIFEST_VERSION__,
  });

  // @ts-expect-error: should only accept entrypoints or public assets
  browser.runtime.getURL('/');
  browser.runtime.getURL('/background.js');
  browser.runtime.getURL('/icon/128.png');
});
