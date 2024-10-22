import { UAParser } from 'ua-parser-js';
import type {
  Analytics,
  AnalyticsConfig,
  AnalyticsPageViewEvent,
  AnalyticsStorageItem,
  AnalyticsTrackEvent,
  BaseAnalyticsEvent,
} from './types';

const ANALYTICS_PORT = '@wxt-dev/analytics';

export function createAnalytics(config?: AnalyticsConfig): Analytics {
  if (typeof chrome === 'undefined' || !chrome?.runtime?.id)
    throw Error(
      'Cannot use WXT analytics in contexts without access to the browser.runtime APIs',
    );
  if (config == null) {
    console.warn(
      "[@wxt-dev/analytics] Config not provided to createAnalytics. If you're using WXT, add the 'analytics' property to '<srcDir>/app.config.ts'.",
    );
  }

  // TODO: This only works for standard WXT extensions, add a more generic
  // background script detector that works with non-WXT projects.
  if (location.pathname === '/background.js')
    return createBackgroundAnalytics(config);

  return createFrontendAnalytics(config);
}

/**
 * Creates an analytics client in the background responsible for uploading events to the server to avoid CORS errors.
 */
function createBackgroundAnalytics(
  config: AnalyticsConfig | undefined,
): Analytics {
  // User properties storage
  const userIdStorage =
    config?.userId ?? defineStorageItem<string>('wxt-analytics:user-id');
  const userPropertiesStorage =
    config?.userProperties ??
    defineStorageItem<Record<string, string>>(
      'wxt-analytics:user-properties',
      {},
    );
  const enabled =
    config?.enabled ??
    defineStorageItem<boolean>('local:wxt-analytics:enabled', false);

  // Cached values
  const platformInfo = chrome.runtime.getPlatformInfo();
  const userAgent = UAParser();
  let userId = Promise.resolve(userIdStorage.getValue()).then(
    (id) => id ?? globalThis.crypto.randomUUID(),
  );
  let userProperties = userPropertiesStorage.getValue();
  const manifest = chrome.runtime.getManifest();

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
        url: meta.url,
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
        page: {
          url,
          location: globalThis.location?.href,
          title: globalThis.document?.title,
        },
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

/**
 * Creates an analytics client for non-background contexts.
 */
function createFrontendAnalytics(
  config: AnalyticsConfig | undefined,
): Analytics {
  const port = chrome.runtime.connect({ name: ANALYTICS_PORT });
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
    (...args: any[]) => {
      if (config?.debug) {
        console.debug(
          `[analytics] Sending ${fn} to background for upload`,
          ...args,
        );
      }
      port.postMessage({ fn, args: [...args, getMetadata()] });
    };

  const analytics: Analytics = {
    identify: methodForwarder('identify'),
    page: methodForwarder('page'),
    track: methodForwarder('track'),
    setEnabled: methodForwarder('setEnabled'),
    autoTrack: (root) => {
      if (config?.debug) {
        console.debug('[analytics] autoTrack() called!');
      }
      const onClick = (event: Event) => {
        const element = event.target as any;
        if (config?.debug) {
          console.debug('[analytics] autoTrack() element clicked', element);
        }
        if (
          !element ||
          (!INTERACTIVE_TAGS.has(element.tagName) &&
            !INTERACTIVE_ROLES.has(element.getAttribute('role')))
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

interface ForwardMetadata {
  sessionId: number | undefined;
  timestamp: number;
  screen: string | undefined;
  language: string | undefined;
  referrer: string | undefined;
  url: string | undefined;
}

function defineStorageItem<T>(
  key: string,
  defaultValue?: NonNullable<T>,
): AnalyticsStorageItem<T> {
  return {
    getValue: async () =>
      (await chrome.storage.local.get(key))[key] ?? defaultValue,
    setValue: (newValue) => chrome.storage.local.set({ [key]: newValue }),
  };
}

const INTERACTIVE_TAGS = new Set([
  'A',
  'BUTTON',
  'INPUT',
  'SELECT',
  'TEXTAREA',
]);
const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'checkbox',
  'menuitem',
  'tab',
  'radio',
]);
