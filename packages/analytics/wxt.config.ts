import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Analytics Demo',
  },
  vite: () => ({
    define: {
      'process.env.NPM': 'false',
    },
  }),
});
