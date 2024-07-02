import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    define: {
      'process.env.NPM': 'false',
    },
  }),
  myModule: {
    example: 'options',
  },
});
