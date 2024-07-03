import 'wxt';
import 'wxt/sandbox';
import { addWxtPlugin, defineWxtModule } from 'wxt/modules';
import { resolve } from 'node:path';
import { AnalyticsConfig } from './types';

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    analytics: AnalyticsConfig;
  }
}

const pluginId = process.env.NPM
  ? '@wxt-dev/analytics/client'
  : resolve(__dirname, 'client.ts');

export default defineWxtModule({
  name: 'analytics',
  imports: [{ name: 'analytics', from: pluginId }],
  setup(wxt) {
    // Add a plugin
    addWxtPlugin(
      wxt,
      resolve(__dirname, process.env.NPM ? 'client.mjs' : 'client.ts'),
    );
  },
});
