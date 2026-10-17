import { defineAppConfig } from 'wxt/utils/define-app-config';
import { googleAnalytics4 } from './modules/analytics/providers/google-analytics-4';
import { posthog } from './modules/analytics/providers/posthog';
import { umami } from './modules/analytics/providers/umami';
import { moderok } from './modules/analytics/providers/moderok.ts';

export default defineAppConfig({
  analytics: {
    debug: true,
    providers: [
      googleAnalytics4({
        apiSecret: '...',
        measurementId: '...',
      }),
      posthog({
        apiKey: '...',
        apiHost: '...',
        errorTracking: true,
      }),
      umami({
        apiUrl: 'https://umami.aklinker1.io/api',
        domain: 'analytics.wxt.dev',
        websiteId: '8f1c2aa4-fad3-406e-a5b2-33e8d4501716',
      }),
      moderok({
        appKey: '...',
        endpoint: 'https://moderok.aklinker1.io/api',
        trackLifecycle: true,
        trackUninstalls: true,
        uninstallUrl: 'https://moderok.aklinker1.io/uninstall',
      }),
    ],
  },
});
