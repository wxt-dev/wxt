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
  browser.runtime.getURL('/icon-128.png');

  console.log([
    // @ts-expect-error: browser.i18n should only accept known message names
    browser.i18n.getMessage('test'),
    browser.i18n.getMessage('promptForName'),
    browser.i18n.getMessage('hello', ['Aaron']),
    browser.i18n.getMessage('bye', ['Aaron']),
    browser.i18n.getMessage('@@extension_id'),
    browser.i18n.getMessage('nItems'),
  ]);

  console.log([
    // @ts-expect-error: i18n should only accept known message names
    i18n.t('test'),
    i18n.t('promptForName'),
    i18n.t('hello', ['Aaron']),
    i18n.t('bye', ['Aaron']),
    i18n.t('@@extension_id'),
    i18n.tp('nItems', 0, ['0']),
  ]);

  console.log('WXT MODE:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });

  storage.setItem('session:startTime', Date.now());
});
