import 'wxt';
import 'wxt/sandbox';
import { addWxtPlugin, defineWxtModule } from 'wxt/modules';
import { resolve, dirname } from 'node:path';
import { AnalyticsConfig } from './types';
import { fileURLToPath } from 'url';

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    analytics: AnalyticsConfig;
  }
}

const _dirname = dirname(fileURLToPath(import.meta.url));

const pluginId = process.env.NPM
  ? '@wxt-dev/analytics/client'
  : resolve(_dirname, 'client.ts');

export default defineWxtModule({
  name: 'analytics',
  imports: [{ name: 'analytics', from: pluginId }],
  setup(wxt) {
    // Add a plugin
    addWxtPlugin(
      wxt,
      resolve(_dirname, process.env.NPM ? 'client.mjs' : 'client.ts'),
    );

    wxt.hooks.hook('build:manifestGenerated', (_, manifest) => {
      manifest.permissions ??= [];
      if (!manifest.permissions.includes('storage')) {
        manifest.permissions.push('storage');
      }
    });
  },
});
