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
      'providers/moderok': './modules/analytics/providers/moderok.ts',
      'providers/posthog': './modules/analytics/providers/posthog.ts',
    },
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
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
        cache: {
          input: [{ auto: true }, '!.wxt/**'],
        },
        command: 'vp exec wxt prepare',
      },
    },
  },
});
