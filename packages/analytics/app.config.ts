import { googleAnalytics4 } from './modules/analytics/providers/google-analytics-4';
import { umami } from './modules/analytics/providers/umami';

export default defineAppConfig({
  analytics: {
    debug: true,
    providers: [
      googleAnalytics4({
        apiSecret: '...',
        measurementId: '...',
      }),
      umami({
        baseUrl: 'https://umami.aklinker1.io',
        hostname: 'analytics.wxt.dev',
        websiteId: '8f1c2aa4-fad3-406e-a5b2-33e8d4501716',
      }),
    ],
  },
});
