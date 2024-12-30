import { defineBuildConfig } from 'unbuild';
import { resolve } from 'node:path';

// Build module and plugins
export default defineBuildConfig({
  rootDir: 'modules/analytics',
  outDir: resolve(__dirname, 'dist'),
  entries: [
    { input: 'index.ts', name: 'module' },
    { input: 'client.ts', name: 'index' },
    { input: 'plugin.ts', name: 'wxt-plugin' },
    'types.ts',
    'providers/google-analytics-4.ts',
    'providers/umami.ts',
  ],
  externals: ['#analytics'],
  replace: {
    'ipmort.meta.env.NPM': 'true',
  },
  declaration: true,
});
