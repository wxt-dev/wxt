import messages from 'public/_locales/en/messages.json';

export default defineBackground({
  type: 'module',

  main() {
    console.log(browser.runtime.id);
    logId();
    console.log({
      browser: import.meta.env.BROWSER,
      chrome: import.meta.env.CHROME,
      firefox: import.meta.env.FIREFOX,
      manifestVersion: import.meta.env.MANIFEST_VERSION,
      messages,
    });

    // @ts-expect-error: should only accept entrypoints or public assets
    browser.runtime.getURL('/');
    browser.runtime.getURL('/background.js');
    browser.runtime.getURL('/icon/128.png');
    browser.runtime.getURL('/example.html#hash');
    browser.runtime.getURL('/example.html?query=param');
    // @ts-expect-error: should only allow hashes/query params on HTML files
    browser.runtime.getURL('/icon-128.png?query=param');

    // @ts-expect-error: should only accept known message names
    browser.i18n.getMessage('test');
    browser.i18n.getMessage('prompt_for_name');
    browser.i18n.getMessage('hello', 'Aaron');
    browser.i18n.getMessage('bye', ['Aaron']);
    browser.i18n.getMessage('@@extension_id');

    console.log('WXT MODE:', {
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    });

    storage.setItem('session:startTime', Date.now());
  },
});
