import { defineBuildConfig } from 'unbuild';
import { resolve } from 'node:path';

// Build module and plugins
export default defineBuildConfig({
  rootDir: 'modules/analytics',
  outDir: resolve(__dirname, 'dist'),
  entries: [
    'index.ts',
    'client.ts',
    'types.ts',
    'providers/google-analytics-4.ts',
    'providers/umami.ts',
  ],
  replace: {
    'ipmort.meta.env.NPM': 'true',
  },
  declaration: true,
});
