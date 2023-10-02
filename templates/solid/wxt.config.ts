import { defineConfig } from 'wxt';
import Solid from 'vite-plugin-solid';

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    build: {
      target: 'esnext',
    },
    plugins: [Solid()],
  }),
});
