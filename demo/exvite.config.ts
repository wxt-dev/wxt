import { defineConfig } from 'exvite';

export default defineConfig({
  storeIds: {
    chrome: '123',
  },
  manifest: {
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png',
    },
  },
});
