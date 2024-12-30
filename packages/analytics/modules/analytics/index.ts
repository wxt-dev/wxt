import 'wxt';
import 'wxt/sandbox';
import { addAlias, addWxtPlugin, defineWxtModule } from 'wxt/modules';
import { resolve } from 'node:path';
import type { AnalyticsConfig } from './types';

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    analytics: AnalyticsConfig;
  }
}

export default defineWxtModule({
  name: 'analytics',
  imports: [{ name: 'analytics', from: '#analytics' }],
  setup(wxt) {
    // Add required permissions
    wxt.hook('build:manifestGenerated', (_, manifest) => {
      manifest.permissions ??= [];
      if (!manifest.permissions.includes('storage')) {
        manifest.permissions.push('storage');
      }
    });

    // Generate #analytics module
    const analyticsModulePath = resolve(
      wxt.config.wxtDir,
      'analytics/index.ts',
    );
    const analyticsModuleCode = `
import { createAnalytics } from '@wxt-dev/analytics';
import { useAppConfig } from 'wxt/client';

export const analytics = createAnalytics(useAppConfig().analytics);
    `;
    addAlias(wxt, '#analytics', analyticsModulePath);
    wxt.hook('prepare:types', async (_, entries) => {
      entries.push({
        path: analyticsModulePath,
        text: analyticsModuleCode,
      });
    });

    addWxtPlugin(wxt, '@wxt-dev/analytics/wxt-plugin');
  },
});
