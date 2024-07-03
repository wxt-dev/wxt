import type { AnalyticsProvider } from '../types';

const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 100;

export interface GoogleAnalyticsProviderOptions {
  apiSecret: string;
  measurementId: string;
}

export const googleAnalytics4 =
  (options: GoogleAnalyticsProviderOptions): AnalyticsProvider =>
  (_, config) => {
    const sendEvent = async (data: SendEventData): Promise<void> => {
      const url = new URL(
        config?.debug ? '/debug/mp/collect' : '/mp/collect',
        'https://www.google-analytics.com',
      );
      if (options.apiSecret)
        url.searchParams.set('api_secret', options.apiSecret);
      if (options.measurementId)
        url.searchParams.set('measurement_id', options.measurementId);

      await fetch(url.href, {
        method: 'POST',
        body: JSON.stringify({
          client_id: data.user.id,
          consent: {
            ad_user_data: 'DENIED',
            ad_personalization: 'DENIED',
          },
          user_properties: data.user.properties,
          events: [
            {
              name: data.event.name,
              params: {
                session_id: data.sessionId,
                engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_IN_MSEC,
                ...data.event.properties,
              },
            },
          ],
        }),
      });
    };

    return {
      identify: () => Promise.resolve(), // No-op, user data uploaded in page/track
      page: (event) => {
        const properties: Record<string, string> = {};
        if (event.page.title) properties.page_title = event.page.title;
        if (event.page.location) properties.page_location = event.page.location;
        return sendEvent({
          ...event,
          event: { name: 'page_view', properties },
        });
      },
      track: (event) =>
        sendEvent({
          ...event,
          event: {
            name: event.event.name,
            properties: event.event.properties,
          },
        }),
    };
  };

export interface SendEventData {
  sessionId: number;
  user: {
    id: string;
    properties: Record<string, string>;
  };
  event: {
    name: string;
    properties?: Record<string, string>;
  };
}
