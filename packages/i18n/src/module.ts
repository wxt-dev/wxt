import 'wxt';
import { defineWxtModule } from 'wxt/modules';
// import {
//   generateDtsFile,
//   generateChromeMessagesText,
//   parseMessagesFile,
// } from './build';
// import glob from 'fast-glob';

export default defineWxtModule({
  name: 'wxt-builtin-i18n',
  configKey: 'i18n',

  setup(wxt) {
    wxt.hooks.hook('build:done', async (wxt, bundle) => {
      // const _files = glob('locales/*');
    });
  },
});
