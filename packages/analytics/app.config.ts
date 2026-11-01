import { defineAppConfig } from 'wxt/utils/define-app-config';
import { umami } from './modules/analytics/providers/umami';

export default defineAppConfig({
  analytics: {
    debug: true,
    providers: [
      umami({
        apiUrl: 'https://umami.aklinker1.io/api',
        domain: 'analytics.wxt.dev',
        websiteId: '8f1c2aa4-fad3-406e-a5b2-33e8d4501716',
      }),
    ],
  },
});
