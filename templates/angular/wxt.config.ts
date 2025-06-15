import { defineConfig } from 'wxt';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  vite: () => ({
    plugins: [
      angular({
        transformFilter: (_, id) =>
          !(id.endsWith('background.ts') || id.endsWith('content.ts')),
      }),
    ],
  }),
});
