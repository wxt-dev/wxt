import { defineConfig } from 'wxt';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// See https://wxt.dev/config.html
export default defineConfig({
  srcDir: 'src',
  vite: {
    logLevel: 'info',
    plugins: [svelte()],
  },
});
