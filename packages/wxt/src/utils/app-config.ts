/** @module wxt/utils/app-config */
// @ts-expect-error: Untyped virtual module
import appConfig from 'virtual:app-config';
import type { WxtAppConfig } from './define-app-config';

/**
 * Get runtime config defined in `<srcDir>/app.config.ts`
 *
 * @see https://wxt.dev/guide/essentials/config/runtime.html
 */
export function getAppConfig(): WxtAppConfig {
  return appConfig;
}

/**
 * Alias for {@link getAppConfig}.
 *
 * @see https://wxt.dev/guide/essentials/config/runtime.html
 */
export function useAppConfig(): WxtAppConfig {
  return getAppConfig();
}
