import type { AnalyticsProvider } from '../types';

export interface GoogleAnalyticsProviderOptions {}

export const googleAnalytics =
  (options: GoogleAnalyticsProviderOptions): AnalyticsProvider =>
  (analytics, config) => {
    return {
      identify: async () => {},
      page: async () => {},
      track: async () => {},
    };
  };
