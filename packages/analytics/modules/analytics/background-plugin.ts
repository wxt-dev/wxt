import { browser } from '@wxt-dev/browser';

export default () => {
  // This plugin runs in every entrypoint, including MAIN-world content
  // scripts, which don't have browser.runtime access and would crash.
  if (browser?.runtime?.id) {
    import('#analytics');
  }
};
