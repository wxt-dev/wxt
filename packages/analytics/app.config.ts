import { googleAnalytics4 } from './modules/analytics/providers/google-analytics-4';
import { umami } from './modules/analytics/providers/umami';

export default defineAppConfig({
  analytics: {
    providers: [
      googleAnalytics4({
        apiSecret: '...',
        measurementId: '...',
      }),
      umami({
        baseUrl: 'https://umami.aklinker1.io',
        hostname: '...',
        websiteId: '...',
      }),
    ],
    debug: true,
  },
});
