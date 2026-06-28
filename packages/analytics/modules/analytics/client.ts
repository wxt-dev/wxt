import { UAParser } from 'ua-parser-js';
import type {
  Analytics,
  AnalyticsConfig,
  AnalyticsEventMetadata,
  AnalyticsPageViewEvent,
  AnalyticsProvider,
  AnalyticsStorageItem,
  AnalyticsTrackEvent,
  BaseAnalyticsEvent,
} from './types';
import { browser } from '@wxt-dev/browser';
import { isBackground } from '@wxt-dev/is-background';

type AsyncAnalyticsMethod = 'identify' | 'page' | 'track' | 'setEnabled';

type BackgroundAnalyticsArgs = {
  identify: [
    userId: string,
    userProperties?: Record<string, string>,
    meta?: AnalyticsEventMetadata,
  ];
  page: [location?: string, meta?: AnalyticsEventMetadata];
  track: [
    eventName: string,
    eventProperties?: Record<string, string | undefined>,
    meta?: AnalyticsEventMetadata,
  ];
  setEnabled: [enabled: boolean];
};

type AnalyticsRequestMessage = {
  [K in AsyncAnalyticsMethod]: {
    id: number;
    fn: K;
    args: BackgroundAnalyticsArgs[K];
  };
}[AsyncAnalyticsMethod];

type AnalyticsRequestPayload = {
  [K in AsyncAnalyticsMethod]: {
    fn: K;
    args: BackgroundAnalyticsArgs[K];
  };
}[AsyncAnalyticsMethod];

type AnalyticsResponseMessage =
  | { id: number; status: 'fulfilled' }
  | { id: number; status: 'rejected'; error: string };

type AnalyticsPortMessage = AnalyticsRequestMessage | AnalyticsResponseMessage;

type BackgroundAnalytics = {
  [K in AsyncAnalyticsMethod]: (
    ...args: BackgroundAnalyticsArgs[K]
  ) => Promise<void>;
};

const ANALYTICS_PORT = '@wxt-dev/analytics';

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

function isAnalyticsResponse(
  message: AnalyticsPortMessage,
): message is AnalyticsResponseMessage {
  return 'status' in message;
}

async function callBackgroundAnalytics(
  analytics: BackgroundAnalytics,
  message: AnalyticsRequestMessage,
): Promise<void> {
  switch (message.fn) {
    case 'identify':
      return analytics.identify(...message.args);
    case 'page':
      return analytics.page(...message.args);
    case 'track':
      return analytics.track(...message.args);
    case 'setEnabled':
      return analytics.setEnabled(...message.args);
  }
}

export function createAnalytics(config?: AnalyticsConfig): Analytics {
  if (!browser?.runtime?.id)
    throw Error(
      'Cannot use WXT analytics in contexts without access to the browser.runtime APIs',
    );
  if (config == null) {
    console.warn(
      "[@wxt-dev/analytics] Config not provided to createAnalytics. If you're using WXT, add the 'analytics' property to '<srcDir>/app.config.ts'.",
    );
  }

  if (isBackground()) return createBackgroundAnalytics(config);

  return createFrontendAnalytics();
}

/**
 * Creates an analytics client in the background responsible for uploading
 * events to the server to avoid CORS errors.
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
  const platformInfo = browser.runtime.getPlatformInfo();
  const userAgent = UAParser();
  let userId = Promise.resolve(userIdStorage.getValue()).then(
    (id) => id ?? globalThis.crypto.randomUUID(),
  );
  let userProperties = userPropertiesStorage.getValue();
  const manifest = browser.runtime.getManifest();

  const getBackgroundMeta = () => ({
    timestamp: Date.now(),
    // Don't track sessions for the background, it can be running indefinitely
    // and will inflate session duration stats.
    sessionId: undefined,
    language: navigator.language,
    referrer: undefined,
    screen: undefined,
    url: location.href,
    title: undefined,
  });

  const getBaseEvent = async (
    meta: AnalyticsEventMetadata,
  ): Promise<BaseAnalyticsEvent> => {
    const { arch, os } = await platformInfo;
    return {
      meta,
      user: {
        id: await userId,
        properties: {
          version: config?.version ?? manifest.version_name ?? manifest.version,
          wxtMode: import.meta.env.MODE,
          wxtBrowser: import.meta.env.BROWSER,
          arch,
          os,
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
      meta: AnalyticsEventMetadata = getBackgroundMeta(),
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
      const event = await getBaseEvent(meta);
      if (config?.debug) console.debug('[@wxt-dev/analytics] identify', event);
      if (await enabled.getValue()) {
        await Promise.allSettled(
          providers.map((provider) => provider.identify(event)),
        );
      } else if (config?.debug) {
        console.debug(
          '[@wxt-dev/analytics] Analytics disabled, identify() not uploaded',
        );
      }
    },
    page: async (
      location?: string,
      meta: AnalyticsEventMetadata = getBackgroundMeta(),
    ) => {
      const baseEvent = await getBaseEvent(meta);
      const event: AnalyticsPageViewEvent = {
        ...baseEvent,
        page: {
          url: meta?.url ?? globalThis.location?.href,
          location,
          title: meta?.title ?? globalThis.document?.title,
        },
      };
      if (config?.debug) console.debug('[@wxt-dev/analytics] page', event);
      if (await enabled.getValue()) {
        await Promise.allSettled(
          providers.map((provider) => provider.page(event)),
        );
      } else if (config?.debug) {
        console.debug(
          '[@wxt-dev/analytics] Analytics disabled, page() not uploaded',
        );
      }
    },
    track: async (
      eventName: string,
      eventProperties?: Record<string, string | undefined>,
      meta: AnalyticsEventMetadata = getBackgroundMeta(),
    ) => {
      const baseEvent = await getBaseEvent(meta);
      const event: AnalyticsTrackEvent = {
        ...baseEvent,
        event: { name: eventName, properties: eventProperties },
      };
      if (config?.debug) console.debug('[@wxt-dev/analytics] track', event);
      if (await enabled.getValue()) {
        await Promise.allSettled(
          providers.map((provider) => provider.track(event)),
        );
      } else if (config?.debug) {
        console.debug(
          '[@wxt-dev/analytics] Analytics disabled, track() not uploaded',
        );
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
  const backgroundAnalytics = analytics as BackgroundAnalytics;

  // Listen for messages from the rest of the extension
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === ANALYTICS_PORT) {
      port.onMessage.addListener((message: AnalyticsPortMessage) => {
        if (isAnalyticsResponse(message)) return;

        void (async () => {
          try {
            await callBackgroundAnalytics(backgroundAnalytics, message);
            port.postMessage({ id: message.id, status: 'fulfilled' });
          } catch (error) {
            port.postMessage({
              id: message.id,
              status: 'rejected',
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })();
      });
    }
  });

  return analytics;
}

/** Creates an analytics client for non-background contexts. */
function createFrontendAnalytics(): Analytics {
  const port = browser.runtime.connect({ name: ANALYTICS_PORT });
  const sessionId = Date.now();
  let nextMessageId = 0;
  const pendingMessages = new Map<
    number,
    { resolve: () => void; reject: (error: Error) => void }
  >();
  const getFrontendMetadata = (): AnalyticsEventMetadata => ({
    sessionId,
    timestamp: Date.now(),
    language: navigator.language,
    referrer: document.referrer || undefined,
    screen: `${window.screen.width}x${window.screen.height}`,
    url: location.href,
    title: document.title || undefined,
  });

  port.onMessage.addListener((message: AnalyticsPortMessage) => {
    if (!isAnalyticsResponse(message)) return;

    const pendingMessage = pendingMessages.get(message.id);
    if (pendingMessage == null) return;

    pendingMessages.delete(message.id);
    if (message.status === 'fulfilled') {
      pendingMessage.resolve();
    } else {
      pendingMessage.reject(new Error(message.error));
    }
  });

  port.onDisconnect?.addListener(() => {
    for (const { reject } of pendingMessages.values()) {
      reject(new Error('Analytics background connection closed'));
    }
    pendingMessages.clear();
  });

  const sendRequest = (payload: AnalyticsRequestPayload): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const id = ++nextMessageId;
      pendingMessages.set(id, { resolve, reject });

      try {
        port.postMessage({ id, ...payload } as AnalyticsRequestMessage);
      } catch (error) {
        pendingMessages.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

  const analytics: Analytics = {
    identify: (userId, userProperties) =>
      sendRequest({
        fn: 'identify',
        args: [userId, userProperties, getFrontendMetadata()],
      }),
    page: (location) =>
      sendRequest({
        fn: 'page',
        args: [location, getFrontendMetadata()],
      }),
    track: (eventName, eventProperties) =>
      sendRequest({
        fn: 'track',
        args: [eventName, eventProperties, getFrontendMetadata()],
      }),
    setEnabled: (enabled) =>
      sendRequest({
        fn: 'setEnabled',
        args: [enabled],
      }),
    autoTrack: (root) => {
      const onClick = (event: Event) => {
        const element = event.target as HTMLElement | null;
        if (
          !element ||
          (!INTERACTIVE_TAGS.has(element.tagName) &&
            !INTERACTIVE_ROLES.has(element.getAttribute('role') ?? ''))
        )
          return;

        void analytics.track('click', {
          tagName: element.tagName?.toLowerCase(),
          id: element.id || undefined,
          className: element.className || undefined,
          textContent: element.textContent?.substring(0, 50) || undefined, // Limit text content length
          href: (element as HTMLAnchorElement).href,
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

function defineStorageItem<T>(key: string): AnalyticsStorageItem<T | undefined>;
function defineStorageItem<T>(
  key: string,
  defaultValue: T,
): AnalyticsStorageItem<T>;
function defineStorageItem(
  key: string,
  defaultValue?: unknown,
): AnalyticsStorageItem<unknown> {
  return {
    getValue: async () =>
      (await browser.storage.local.get<Record<string, unknown>>(key))[key] ??
      defaultValue,
    setValue: (newValue) => browser.storage.local.set({ [key]: newValue }),
  };
}

export function defineAnalyticsProvider<T = never>(
  definition: (
    /** The analytics object. */
    analytics: Analytics,
    /** Config passed into the analytics module from `app.config.ts`. */
    config: AnalyticsConfig,
    /** Provider options */
    options: T,
  ) => ReturnType<AnalyticsProvider>,
): (options: T) => AnalyticsProvider {
  return (options) => (analytics, config) =>
    definition(analytics, config, options);
}
