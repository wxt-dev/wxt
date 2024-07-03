import { defineWxtPlugin } from 'wxt/sandbox';
import {
  Analytics,
  AnalyticsConfig,
  AnalyticsPageViewEvent,
  AnalyticsTrackEvent,
  BaseAnalyticsEvent,
} from './types';

export let analytics: Analytics;
const ANALYTICS_PORT = 'wxt-analytics';

export default <any>defineWxtPlugin(() => {
  const isBackground = globalThis.window == null; // TODO: Support MV2
  analytics = isBackground
    ? createBackgroundAnalytics()
    : createAnalyticsForwarder();
});

function createAnalyticsForwarder(): Analytics {
  const port = browser.runtime.connect({ name: ANALYTICS_PORT });
  const sessionId = Date.now();
  const getMetadata = (): ForwardMetadata => ({
    sessionId,
    timestamp: Date.now(),
  });

  const methodForwarder =
    (fn: string) =>
    (...args: any[]) =>
      port.postMessage({ fn, args: [...args, getMetadata()] });

  const analytics: Analytics = {
    identify: methodForwarder('identify'),
    page: methodForwarder('page'),
    track: methodForwarder('track'),
    autoTrack: (root) => {
      const onClick = (event: Event) => {
        const element = event.target as any;
        if (!element) return;

        void analytics.track('click', {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          textContent: element.textContent?.substring(0, 50), // Limit text content length
          href: element.href,
        });
      };
      root.addEventListener('click', onClick, { capture: true, passive: true });
      return () => {
        root.removeEventListener('click', onClick);
      };
    },
  };
  return analytics;
}

/**
 * Background analytics is responsible for reporting events triggered in the
 * background, and for reporting forwarded events from the other contexts.
 */
function createBackgroundAnalytics(): Analytics {
  const config = useAppConfig().analytics as AnalyticsConfig | undefined;
  const backgroundSessionId = Date.now();

  // User properties storage
  const userIdStorage = storage.defineItem<string>(
    'local:wxt-analytics:user-id',
  );
  const userPropertiesStorage = storage.defineItem<Record<string, string>>(
    'local:wxt-analytics:user-properties',
    { defaultValue: {} },
  );

  // Cached values
  const platformInfo = browser.runtime.getPlatformInfo();
  const browserInfo = browser.runtime.getBrowserInfo();
  let userId = userIdStorage
    .getValue()
    .then((id) => id ?? globalThis.crypto.randomUUID());
  let userProperties = userPropertiesStorage.getValue();

  const getBaseEvent = async (
    meta: ForwardMetadata = {
      sessionId: backgroundSessionId,
      timestamp: Date.now(),
    },
  ): Promise<BaseAnalyticsEvent> => ({
    sessionId: meta.sessionId,
    timestamp: meta.timestamp,
    user: {
      id: await userId,
      properties: {
        ...(await platformInfo),
        ...(await browserInfo),
        ...(await userProperties),
      },
    },
  });

  const analytics = {
    identify: async (
      newUserId: string,
      newUserProperties: Record<string, string> = {},
      forwardMeta?: ForwardMetadata,
    ) => {
      // Update in-memory cache for all providers
      userId = Promise.resolve(newUserId);
      userProperties = Promise.resolve(newUserProperties);
      // Persist user info to storage
      await Promise.all([
        userIdStorage.setValue(newUserId),
        userPropertiesStorage.setValue(newUserProperties),
      ]);
      // Notify providers
      const event = await getBaseEvent(forwardMeta);
      if (config?.debug) console.debug('analytics.identify', event);
      await Promise.all(providers.map((provider) => provider.identify(event)));
    },
    page: async (url: string, forwardMeta?: ForwardMetadata) => {
      const baseEvent = await getBaseEvent(forwardMeta);
      const event: AnalyticsPageViewEvent = {
        ...baseEvent,
        page: { url },
      };
      if (config?.debug) console.debug('analytics.page', event);
      await Promise.all(providers.map((provider) => provider.page(event)));
    },
    track: async (
      eventName: string,
      eventProperties?: Record<string, string>,
      forwardMeta?: ForwardMetadata,
    ) => {
      const baseEvent = await getBaseEvent(forwardMeta);
      const event: AnalyticsTrackEvent = {
        ...baseEvent,
        event: { name: eventName, properties: eventProperties },
      };
      if (config?.debug) console.debug('analytics.track', event);
      await Promise.all(providers.map((provider) => provider.track(event)));
    },
    autoTrack: () => {
      // Noop, background doesn't have a UI
      return () => {};
    },
  } satisfies Analytics;

  const providers =
    config?.providers?.map((provider) => provider(analytics, config)) ?? [];

  // Listen for messages from the rest of the extension
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === ANALYTICS_PORT) {
      port.onMessage.addListener(({ fn, args }) => {
        // @ts-expect-error: Untyped fn key
        void analytics[fn]?.(...args);
      });
    }
  });

  return analytics;
}

interface ForwardMetadata {
  sessionId: number;
  timestamp: number;
}
