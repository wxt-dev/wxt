import 'wxt';
import { resolve } from 'node:path';

import { addViteConfig, defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  name: '@wxt-dev/webextension-polyfill',
  setup(wxt) {
    addViteConfig(wxt, () => ({
      resolve: {
        alias: {
          'wxt/browser': process.env.NPM
            ? '@wxt-dev/webextension-polyfill/browser'
            : resolve(__dirname, 'browser.ts'),
        },
      },
    }));
  },
});
