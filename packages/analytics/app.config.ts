import { googleAnalytics } from './modules/analytics/providers/google-analytics';
import { umami } from './modules/analytics/providers/umami';

export default defineAppConfig({
  analytics: {
    providers: [
      googleAnalytics({
        apiSecret: '...',
        measurementId: '...',
      }),
      umami({
        hostname: '...',
        website: '...',
      }),
    ],
    debug: true,
  },
});
