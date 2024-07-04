import { defineWxtPlugin } from 'wxt/sandbox';
import {
  Analytics,
  AnalyticsConfig,
  AnalyticsPageViewEvent,
  AnalyticsTrackEvent,
  BaseAnalyticsEvent,
} from './types';
import uaParser from 'ua-parser-js';

export let analytics: Analytics;
const ANALYTICS_PORT = 'wxt-analytics';
const interactiveTags = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
const interactiveRoles = new Set([
  'button',
  'link',
  'checkbox',
  'menuitem',
  'tab',
  'radio',
]);

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
    language: navigator.language,
    referrer: globalThis.document?.referrer || undefined,
    screen: globalThis.window
      ? `${globalThis.window.screen.width}x${globalThis.window.screen.height}`
      : undefined,
    url: location.href,
  });

  const methodForwarder =
    (fn: string) =>
    (...args: any[]) =>
      port.postMessage({ fn, args: [...args, getMetadata()] });

  const analytics: Analytics = {
    identify: methodForwarder('identify'),
    page: methodForwarder('page'),
    track: methodForwarder('track'),
    setEnabled: methodForwarder('setEnabled'),
    autoTrack: (root) => {
      const onClick = (event: Event) => {
        const element = event.target as any;
        if (
          !element ||
          (!interactiveTags.has(element.tagName) &&
            !interactiveRoles.has(element.getAttribute('role')))
        )
          return;

        void analytics.track('click', {
          tagName: element.tagName?.toLowerCase(),
          id: element.id || undefined,
          className: element.className || undefined,
          textContent: element.textContent?.substring(0, 50) || undefined, // Limit text content length
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

  // User properties storage
  const userIdStorage =
    config?.userId ?? storage.defineItem<string>('local:wxt-analytics:user-id');
  const userPropertiesStorage =
    config?.userProperties ??
    storage.defineItem<Record<string, string>>(
      'local:wxt-analytics:user-properties',
      { defaultValue: {} },
    );
  const enabled =
    config?.enabled ??
    storage.defineItem<boolean>('local:wxt-analytics:enabled', {
      defaultValue: false,
    });

  // Cached values
  const platformInfo = browser.runtime.getPlatformInfo();
  const userAgent = uaParser();
  let userId = Promise.resolve(userIdStorage.getValue()).then(
    (id) => id ?? globalThis.crypto.randomUUID(),
  );
  let userProperties = userPropertiesStorage.getValue();
  const manifest = browser.runtime.getManifest();

  const getBaseEvent = async (
    meta: ForwardMetadata = {
      timestamp: Date.now(),
      // Don't track sessions for the background, it can be running
      // indefinitely, and will inflate session duration stats.
      sessionId: undefined,
      language: navigator.language,
      referrer: undefined,
      screen: undefined,
      url: location.href,
    },
  ): Promise<BaseAnalyticsEvent> => {
    const platform = await platformInfo;
    return {
      meta: {
        sessionId: meta.sessionId,
        timestamp: meta.timestamp,
        screen: meta.screen,
        referrer: meta.referrer,
        language: meta.language,
      },
      user: {
        id: await userId,
        properties: {
          version: config?.version ?? manifest.version_name ?? manifest.version,
          wxtMode: import.meta.env.MODE,
          wxtBrowser: import.meta.env.BROWSER,
          arch: platform.arch,
          os: platform.os,
          browser: userAgent.browser.name,
          browserVersion: userAgent.browser.version,
          ...(await userProperties),
        },
      },
    };
  };

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
        userIdStorage.setValue?.(newUserId),
        userPropertiesStorage.setValue?.(newUserProperties),
      ]);
      // Notify providers
      const event = await getBaseEvent(forwardMeta);
      if (config?.debug) console.debug('[analytics] identify', event);
      if (await enabled.getValue()) {
        await Promise.allSettled(
          providers.map((provider) => provider.identify(event)),
        );
      } else if (config?.debug) {
        console.debug('[analytics] Disabled, identify() not called');
      }
    },
    page: async (url: string, forwardMeta?: ForwardMetadata) => {
      const baseEvent = await getBaseEvent(forwardMeta);
      const event: AnalyticsPageViewEvent = {
        ...baseEvent,
        page: { url },
      };
      if (config?.debug) console.debug('[analytics] page', event);
      if (await enabled.getValue()) {
        await Promise.allSettled(
          providers.map((provider) => provider.page(event)),
        );
      } else if (config?.debug) {
        console.debug('[analytics] Disabled, page() not called');
      }
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
      if (config?.debug) console.debug('[analytics] track', event);
      if (await enabled.getValue()) {
        await Promise.allSettled(
          providers.map((provider) => provider.track(event)),
        );
      } else if (config?.debug) {
        console.debug('[analytics] Disabled, track() not called');
      }
    },
    setEnabled: async (newEnabled) => {
      await enabled.setValue?.(newEnabled);
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
  sessionId: number | undefined;
  timestamp: number;
  screen: string | undefined;
  language: string | undefined;
  referrer: string | undefined;
  url: string | undefined;
}
