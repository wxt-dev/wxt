import { defineAnalyticsProvider } from '../client-utils';

export interface UmamiProviderOptions {
  apiUrl: string;
  websiteId: string;
  domain: string;
}

export const umami = defineAnalyticsProvider<UmamiProviderOptions>(
  (analytics, config, options) => {
    const send = (payload: UmamiPayload) =>
      fetch(`${options.apiUrl}/send`, {
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
          hostname: options.domain,
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
          hostname: options.domain,
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
  },
);

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
