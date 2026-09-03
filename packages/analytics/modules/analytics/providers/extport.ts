import { defineAnalyticsProvider } from '../client';
import { browser } from '@wxt-dev/browser';
import type { BaseAnalyticsEvent } from '../types';

const DEFAULT_API_BASE = 'https://api.extport.dev';
const PING_STORAGE_KEY = 'extport:last-ping-date';

/**
 * Internal event name used to route the daily ping through
 * `analytics.track()`, so the module's consent gate (`enabled`) applies to
 * it like any other event.
 */
const PING_EVENT = '__extport_ping';

export interface ExtportProviderOptions {
  /** The extension's extport id (`ext_…`), from https://dash.extport.dev. */
  extensionId: string;
  /** Override for self-hosted extport instances. */
  apiBase?: string;
}

/**
 * Firefox 140+ has a built-in data-collection consent mechanism: when
 * `permissions.getAll()` reports a `data_collection` array,
 * `technicalAndInteraction` must be present in it (the toggle shown in the
 * install prompt and in about:addons). When the key is absent the browser
 * has no such mechanism and the manifest disclosure governs. Read at ping
 * time so revocation needs no listener — the next ping re-checks.
 */
async function browserConsentsToAnalytics(): Promise<boolean> {
  try {
    const all = (await browser.permissions.getAll()) as {
      data_collection?: string[];
    };
    return (
      all.data_collection === undefined ||
      all.data_collection.includes('technicalAndInteraction')
    );
  } catch {
    // Only environments without the permissions API get here — same
    // treatment as the key being absent.
    return true;
  }
}

/**
 * [extport](https://extport.dev)'s analytics protocol has exactly one
 * event: an anonymous daily ping per install. Installs, actives, and churn
 * are all derived from the ping stream server-side, so this provider
 * reports nothing else — custom events are dropped (pair another provider
 * like PostHog or Umami if you need event tracking).
 */
export const extport = defineAnalyticsProvider<ExtportProviderOptions>(
  (analytics, config, options) => {
    const apiBase = options.apiBase ?? DEFAULT_API_BASE;
    const debug = config.debug ?? false;
    let inflight: Promise<void> | undefined;

    const ping = async (event: BaseAnalyticsEvent) => {
      const today = new Date().toISOString().slice(0, 10);
      const stored = await browser.storage.local.get(PING_STORAGE_KEY);
      if (stored[PING_STORAGE_KEY] === today) return;
      if (!(await browserConsentsToAnalytics())) return;

      const payload = {
        installId: event.user.id,
        extensionId: options.extensionId,
        version: event.user.properties.version ?? '0.0.0',
        language: event.meta.language,
      };
      if (debug) {
        console.debug('[@wxt-dev/analytics][extport] Sending:', payload);
      }
      const response = await fetch(`${apiBase}/api/v1/analytics/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Only stamp the day on confirmed delivery — a failed send retries on
      // the next background wake-up. The server is idempotent per install
      // per UTC day, so a retry can never double-count.
      if (response.ok) {
        await browser.storage.local.set({ [PING_STORAGE_KEY]: today });
      }
    };

    const maybePing = (event: BaseAnalyticsEvent) => {
      inflight ??= ping(event)
        .catch((error) => {
          if (debug) {
            console.debug('[@wxt-dev/analytics][extport] Ping failed:', error);
          }
        })
        .finally(() => {
          inflight = undefined;
        });
      return inflight;
    };

    // The provider is initialized from the background, so initialization
    // itself marks a background wake-up — the natural moment for a daily
    // ping. onInstalled makes install day exact instead of waiting for the
    // next wake-up, and permissions.onAdded catches a Firefox user turning
    // the data-collection toggle on later the same day.
    browser.runtime.onInstalled.addListener(() => {
      void analytics.track(PING_EVENT);
    });
    browser.permissions.onAdded?.addListener(() => {
      void analytics.track(PING_EVENT);
    });
    void analytics.track(PING_EVENT);

    return {
      identify: () => Promise.resolve(),
      page: () => Promise.resolve(),
      track: async (event) => {
        if (event.event.name === PING_EVENT) return maybePing(event);
        if (debug) {
          console.debug(
            `[@wxt-dev/analytics][extport] No custom events in the extport protocol — "${event.event.name}" dropped`,
          );
        }
      },
    };
  },
);
