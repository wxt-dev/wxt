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
  /**
   * Send exceptions to PostHog. Unhandled errors and promise rejections in the
   * background are captured automatically, other contexts can use
   * `analytics.captureException`.
   *
   * @default false
   */
  errorTracking?: boolean;
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
      exception: options.errorTracking
        ? async (event) => {
            const { type, message, stack, handled, properties } =
              event.exception;
            await capture(event.user.id, '$exception', {
              ...properties,
              $exception_list: [
                {
                  type,
                  value: message,
                  mechanism: { handled, synthetic: false },
                  stacktrace: stack
                    ? { type: 'raw', frames: parseStackFrames(stack) }
                    : undefined,
                },
              ],
              $exception_level: 'error',
              $current_url: event.meta.url,
              $session_id: event.meta.sessionId,
              $set: event.user.properties,
            });
          }
        : undefined,
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

/** Matches Chromium (`at fn (url:1:2)`) and Firefox (`fn@url:1:2`) frames. */
const STACK_FRAME_REGEX =
  /^\s*(?:at\s+(?:(.*?)\s+\()?|(.*?)@)(.+?):(\d+):(\d+)\)?\s*$/;

/** @see https://posthog.com/docs/error-tracking/installation/manual */
function parseStackFrames(stack: string) {
  // PostHog expects the oldest frame first
  return stack
    .split('\n')
    .flatMap((line) => {
      const match = STACK_FRAME_REGEX.exec(line);
      if (!match) return [];
      const [, chromeFn, firefoxFn, filename, lineno, colno] = match;
      return {
        platform: 'web:javascript',
        filename,
        function: chromeFn || firefoxFn || '?',
        lineno: Number(lineno),
        colno: Number(colno),
        in_app: true,
      };
    })
    .reverse();
}
