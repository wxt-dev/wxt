import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

// See https://wxt.dev/config.html
export default defineConfig({
  vite: {
    plugins: [vue()],
  },
});
