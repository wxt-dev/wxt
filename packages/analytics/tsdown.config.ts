import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './modules/analytics/client.ts',
    module: './modules/analytics/index.ts',
    'background-plugin': './modules/analytics/background-plugin.ts',
    types: './modules/analytics/types.ts',
    'providers/google-analytics-4':
      './modules/analytics/providers/google-analytics-4.ts',
    'providers/umami': './modules/analytics/providers/umami.ts',
  },
  external: ['#analytics'],
  define: {
    'process.env.NPM': 'true',
  },
});
