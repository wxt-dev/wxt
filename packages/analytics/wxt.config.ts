import { defineConfig } from 'wxt';

export default defineConfig({
  // Unimport doesn't look for imports in node_modules, so when developing a
  // node module, we need to disable this.
  imports: false,

  manifest: {
    name: 'Analytics Demo',
  },
  vite: () => ({
    define: {
      'process.env.NPM': 'false',
    },
  }),
});
