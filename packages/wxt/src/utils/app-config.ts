/** @module wxt/utils/app-config */
// @ts-expect-error: Untyped virtual module
import appConfig from 'virtual:app-config';
import type { WxtAppConfig } from './define-app-config';
import { wxt } from '../core/wxt';

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
 * @deprecated Use {@link getAppConfig} instead. Same function, different name.
 * @see https://wxt.dev/guide/essentials/config/runtime.html
 */
export function useAppConfig(): WxtAppConfig {
  // After v1.0 this function will be removed, and migrate to use only `getAppConfig` instead.
  wxt.logger.warn(
    '`useAppConfig` is deprecated. Please use `getAppConfig` instead.',
  );

  return getAppConfig();
}
