import { defineAnalyticsProvider } from '../client';
import { browser } from '@wxt-dev/browser';
import type { BaseAnalyticsEvent } from '../types';

const SDK_VERSION = 'wxt/0.1.0';
const DEFAULT_ENDPOINT = 'https://api.moderok.dev/v1/events';
const PING_STORAGE_KEY = 'moderok:last-ping-date';
const FIRST_OPEN_STORAGE_KEY = 'moderok:first-open';

export interface ModerokProviderOptions {
  appKey: string;
  endpoint?: string;
  trackLifecycle?: boolean;
  trackUninstalls?: boolean;
  uninstallUrl?: string;
}

const OS_MAP: Record<string, string> = {
  mac: 'MacOS',
  win: 'Windows',
  linux: 'Linux',
  cros: 'ChromeOS',
  android: 'Android',
};

const BROWSER_MAP: Record<string, string> = {
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  chromium: 'other_chromium',
};

function mapOs(wxtOs: string | undefined): string {
  if (!wxtOs) return 'unknown';
  return OS_MAP[wxtOs.toLowerCase()] ?? 'unknown';
}

function mapBrowser(wxtBrowser: string | undefined): string {
  if (!wxtBrowser) return 'unknown';
  return BROWSER_MAP[wxtBrowser.toLowerCase()] ?? 'unknown';
}

function detectSource(meta: BaseAnalyticsEvent['meta']): string {
  if (meta.sessionId == null) return 'background';

  const url = meta.url;
  if (!url) return 'unknown';
  const isExtensionUrl =
    url.startsWith('chrome-extension://') || url.startsWith('moz-extension://');
  if (!isExtensionUrl) return 'content_script';

  const path = url.toLowerCase();
  if (path.includes('popup')) return 'popup';
  if (path.includes('option')) return 'options';
  if (
    path.includes('sidepanel') ||
    path.includes('side-panel') ||
    path.includes('side_panel')
  )
    return 'side_panel';

  return 'extension_page';
}

function buildContext(event: BaseAnalyticsEvent, extensionId: string) {
  return {
    sdkVersion: SDK_VERSION,
    extensionId: extensionId || 'unknown',
    extensionVersion: event.user.properties.version || 'unknown',
    browser: mapBrowser(event.user.properties.browser),
    browserVersion: event.user.properties.browserVersion || 'unknown',
    os: mapOs(event.user.properties.os),
    locale: event.meta.language || 'unknown',
    source: detectSource(event.meta),
  };
}

function sendEvent(
  endpoint: string,
  appKey: string,
  event: {
    name: string;
    userId: string;
    timestamp: number;
    context: ReturnType<typeof buildContext>;
    properties?: Record<string, string | number | boolean>;
  },
  debug: boolean,
) {
  const payload = {
    appKey,
    sentAt: Date.now(),
    events: [
      {
        id: globalThis.crypto.randomUUID(),
        name: event.name,
        timestamp: event.timestamp,
        userId: event.userId,
        context: event.context,
        ...(event.properties && Object.keys(event.properties).length > 0
          ? { properties: event.properties }
          : {}),
      },
    ],
  };

  if (debug) {
    console.debug('[@wxt-dev/analytics][moderok] Sending:', payload);
  }

  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

function cleanProperties(
  raw: Record<string, string | undefined> | undefined,
): Record<string, string> | undefined {
  if (!raw) return undefined;
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value != null) clean[key] = value;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

function utcDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildUninstallUrl(
  endpoint: string,
  appKey: string,
  userId: string,
  redirectUrl?: string,
): string {
  const url = new URL(endpoint);
  url.pathname = url.pathname.replace(/\/[^/]*$/, '/uninstall');
  url.searchParams.set('app', appKey);
  url.searchParams.set('uid', userId);
  if (redirectUrl) url.searchParams.set('redirect', redirectUrl);
  return url.toString();
}

export const moderok = defineAnalyticsProvider<ModerokProviderOptions>(
  (analytics, config, options) => {
    const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    const debug = config.debug ?? false;
    const trackLifecycle = options.trackLifecycle ?? true;
    const extensionId = browser.runtime.id ?? '';
    let firstOpenPromise: Promise<void> | undefined;

    const maybeTrackFirstOpen = async (event: BaseAnalyticsEvent) => {
      if (!trackLifecycle) return;
      if (firstOpenPromise) return firstOpenPromise;

      firstOpenPromise = (async () => {
        const stored = await browser.storage.local.get(FIRST_OPEN_STORAGE_KEY);
        if (stored[FIRST_OPEN_STORAGE_KEY]) return;

        const response = await sendEvent(
          endpoint,
          options.appKey,
          {
            name: '__first_open',
            userId: event.user.id,
            timestamp: event.meta.timestamp,
            context: buildContext(event, extensionId),
          },
          debug,
        );

        if (response.ok) {
          await browser.storage.local.set({ [FIRST_OPEN_STORAGE_KEY]: true });
        } else {
          firstOpenPromise = undefined;
        }
      })().catch((error) => {
        firstOpenPromise = undefined;
        throw error;
      });

      return firstOpenPromise;
    };

    if (trackLifecycle) {
      browser.runtime.onInstalled.addListener((details) => {
        if (details.reason === 'install') {
          analytics.track('__install');
        } else if (details.reason === 'update') {
          analytics.track('__update', {
            previousVersion: (details as { previousVersion?: string })
              .previousVersion,
          });
        }
      });

      void (async () => {
        const today = utcDateStamp();
        const stored = await browser.storage.local.get(PING_STORAGE_KEY);
        if (stored[PING_STORAGE_KEY] === today) return;
        await browser.storage.local.set({ [PING_STORAGE_KEY]: today });
        analytics.track('__daily_ping');
      })();
    }

    let uninstallUrlSet = false;
    function maybeSetUninstallUrl(userId: string) {
      if (!options.trackUninstalls || uninstallUrlSet) return;
      uninstallUrlSet = true;

      const url = buildUninstallUrl(
        endpoint,
        options.appKey,
        userId,
        options.uninstallUrl,
      );
      if (url.length <= 1023) {
        browser.runtime.setUninstallURL(url);
      }
    }

    return {
      identify: () => Promise.resolve(),

      page: async (event) => {
        maybeSetUninstallUrl(event.user.id);
        await maybeTrackFirstOpen(event);
        await sendEvent(
          endpoint,
          options.appKey,
          {
            name: '__page_view',
            userId: event.user.id,
            timestamp: event.meta.timestamp,
            context: buildContext(event, extensionId),
            properties: {
              url: event.page.url,
              ...(event.page.title ? { title: event.page.title } : {}),
              ...(event.page.location ? { location: event.page.location } : {}),
            },
          },
          debug,
        );
      },

      track: async (event) => {
        maybeSetUninstallUrl(event.user.id);
        await maybeTrackFirstOpen(event);
        await sendEvent(
          endpoint,
          options.appKey,
          {
            name: event.event.name.trim(),
            userId: event.user.id,
            timestamp: event.meta.timestamp,
            context: buildContext(event, extensionId),
            properties: cleanProperties(event.event.properties),
          },
          debug,
        );
      },
    };
  },
);
