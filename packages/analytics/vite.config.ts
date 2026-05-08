import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: {
      index: './modules/analytics/client.ts',
      module: './modules/analytics/index.ts',
      'background-plugin': './modules/analytics/background-plugin.ts',
      types: './modules/analytics/types.ts',
      'providers/google-analytics-4':
        './modules/analytics/providers/google-analytics-4.ts',
      'providers/umami': './modules/analytics/providers/umami.ts',
    },
    deps: {
      neverBundle: ['#analytics'],
    },
    define: {
      'process.env.NPM': 'true',
    },
  },
  run: {
    tasks: {
      postinstall: {
        dependsOn: [
          'wxt#build',
          '@wxt-dev/storage#build',
          '@wxt-dev/is-background#build',
        ],
        input: [{ auto: true }, '!.wxt/**'],
        command: 'vpx wxt prepare',
      },
    },
  },
});
