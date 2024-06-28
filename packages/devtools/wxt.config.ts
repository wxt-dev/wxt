import { defineConfig } from 'wxt';
import unocss from 'unocss/vite';

export default defineConfig({
  manifest: {
    name: 'Devtools Test Extension',
  },
  hooks: {
    'vite:devServer:extendConfig': (config) => {
      config.plugins!.push(unocss());
    },
  },
});
