import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: {
    addons: {
      vueTemplate: true,
    },
  },
  vite: () => ({
    plugins: [vue()],
    build: {
      // When enabled, hot updates in development mode can cause the root component rendering function to be lost
      sourcemap: false,
    },
  }),
});
