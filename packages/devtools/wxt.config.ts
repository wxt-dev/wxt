import { defineConfig } from 'wxt';
import unocss from 'unocss/vite';

export default defineConfig({
  vite: () => ({
    plugins: [unocss()],
  }),
  manifest: {
    name: 'Devtools Test Extension',
  },
});
