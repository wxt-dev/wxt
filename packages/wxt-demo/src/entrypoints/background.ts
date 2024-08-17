export default defineBackground({
  // type: 'module',

  main() {
    console.log(browser.runtime.id);
    logId();
    console.log({
      url: import.meta.url,
      browser: import.meta.env.BROWSER,
      chrome: import.meta.env.CHROME,
      firefox: import.meta.env.FIREFOX,
      manifestVersion: import.meta.env.MANIFEST_VERSION,
    });

    console.log(useAppConfig());

    // @ts-expect-error: should only accept entrypoints or public assets
    browser.runtime.getURL('/');
    browser.runtime.getURL('/background.js');
    browser.runtime.getURL('/icons/128.png');
    browser.runtime.getURL('/example.html#hash');
    browser.runtime.getURL('/example.html?query=param');
    // @ts-expect-error: should only allow hashes/query params on HTML files
    browser.runtime.getURL('/icon-128.png?query=param');

    // @ts-expect-error: should only accept known message names
    i18n.t('test');
    i18n.t('prompt_for_name');
    i18n.t('hello', ['Aaron']);
    i18n.t('bye', ['Aaron']);
    i18n.t('@@extension_id');

    console.log('WXT MODE:', {
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    });

    storage.setItem('session:startTime', Date.now());
  },
});
