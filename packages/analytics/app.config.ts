import { googleAnalytics } from './modules/analytics/providers/google-analytics';
import { AnalyticsConfig } from './modules/analytics/types';

interface AppConfig {
  analytics: AnalyticsConfig;
}
function defineAppConfig(config: AppConfig): AppConfig {
  return config;
}

export default defineAppConfig({
  analytics: {
    providers: [
      googleAnalytics({
        apiSecret: '...',
        measurementId: '...',
      }),
    ],
    debug: true,
  },
});
