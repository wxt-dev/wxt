import type { AnalyticsProvider } from '../types';

export interface UmamiProviderOptions {
  baseUrl: string;
  websiteId: string;
  hostname: string;
}

export const umami =
  (options: UmamiProviderOptions): AnalyticsProvider =>
  (analytics, config) => {
    throw Error('TODO');
    // return {
    //   identify: async () => {},
    //   page: async () => {},
    //   track: async () => {},
    // };
  };
