import { defineBuildConfig } from 'unbuild';
import { resolve } from 'node:path';

// Build module and plugins
export default defineBuildConfig({
  rootDir: 'modules/analytics',
  outDir: resolve(__dirname, 'dist'),
  entries: [
    'index.ts',
    'client.ts',
    'providers/google-analytics-4.ts',
    'providers/umami.ts',
  ],
  replace: {
    'process.env.NPM': 'true',
  },
  declaration: true,
});
