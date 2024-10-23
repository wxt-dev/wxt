import type { AnalyticsProvider } from '../types';

export interface UmamiProviderOptions {
  baseUrl: string;
  websiteId: string;
  hostname: string;
}

export const umami =
  (options: UmamiProviderOptions): AnalyticsProvider =>
  (analytics, config) => {
    const send = (payload: UmamiPayload) =>
      fetch(`${options.baseUrl}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'event', payload }),
      });

    return {
      identify: () => Promise.resolve(), // No-op, user data uploaded in page/track
      page: async (event) => {
        await send({
          name: 'page_view',
          website: options.websiteId,
          url: event.page.url,
          hostname: options.hostname,
          language: event.meta.language ?? '',
          referrer: event.meta.referrer ?? '',
          screen: event.meta.screen ?? '',
          title: event.page.title ?? '<blank>',
          data: event.user.properties,
        });
      },
      track: async (event) => {
        await send({
          name: event.event.name,
          website: options.websiteId,
          url: event.meta.url ?? '/',
          title: '<blank>',
          hostname: options.hostname,
          language: event.meta.language ?? '',
          referrer: event.meta.referrer ?? '',
          screen: event.meta.screen ?? '',
          data: {
            ...event.event.properties,
            ...event.user.properties,
          },
        });
      },
    };
  };

interface UmamiPayload {
  hostname?: string;
  language?: string;
  referrer?: string;
  screen?: string;
  title?: string;
  url?: string;
  website: string;
  name: string;
  data?: Record<string, string | undefined>;
}
