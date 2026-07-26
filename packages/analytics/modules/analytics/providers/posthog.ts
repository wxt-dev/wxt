import { defineAnalyticsProvider } from '../client';

export interface PostHogProviderOptions {
  /** Your PostHog project API key. */
  apiKey: string;
  /**
   * PostHog API host URL.
   *
   * @default 'https://us.i.posthog.com'
   */
  apiHost?: string;
}

export const posthog = defineAnalyticsProvider<PostHogProviderOptions>(
  (_, config, options) => {
    const apiHost = (options.apiHost ?? 'https://us.i.posthog.com').replace(
      /\/$/,
      '',
    );

    const capture = async (
      distinctId: string,
      event: string,
      properties: Record<string, unknown>,
    ): Promise<void> => {
      if (config.debug) {
        console.debug('[@wxt-dev/analytics] Sending event to PostHog:', {
          event,
          properties,
        });
      }
      const body: PostHogCaptureBody = {
        api_key: options.apiKey,
        distinct_id: distinctId,
        event,
        properties,
        timestamp: new Date().toISOString(),
      };
      await fetch(`${apiHost}/i/v0/e/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    };

    return {
      identify: async (event) => {
        await capture(event.user.id, '$identify', {
          $set: event.user.properties,
        });
      },
      page: async (event) => {
        await capture(event.user.id, '$pageview', {
          $current_url: event.page.url,
          $title: event.page.title,
          $session_id: event.meta.sessionId,
          $screen: event.meta.screen,
          $language: event.meta.language,
          $referrer: event.meta.referrer,
          $set: event.user.properties,
        });
      },
      track: async (event) => {
        await capture(event.user.id, event.event.name, {
          ...event.event.properties,
          $screen: event.meta.screen,
          $language: event.meta.language,
          $referrer: event.meta.referrer,
          $set: event.user.properties,
        });
      },
    };
  },
);

/** @see https://posthog.com/docs/api/capture */
interface PostHogCaptureBody {
  api_key: string;
  distinct_id: string;
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
}
