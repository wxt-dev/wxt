import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

// See https://wxt.dev/config.html
export default defineConfig({
  vite: {
    plugins: [react()],
  },
});
