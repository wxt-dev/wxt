import type { Analytics, AnalyticsConfig, AnalyticsProvider } from './types';

export function defineAnalyticsProvider<T = never>(
  definition: (
    /** The analytics object. */
    analytics: Analytics,
    /** Config passed into the analytics module from `app.config.ts`. */
    config: AnalyticsConfig,
    /** Provider options */
    options: T,
  ) => ReturnType<AnalyticsProvider>,
): (options: T) => AnalyticsProvider {
  return (options) => (analytics, config) =>
    definition(analytics, config, options);
}
