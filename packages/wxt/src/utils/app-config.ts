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
 * @deprecated Use {@link getAppConfig} instead. Same function, different name.
 * @see https://wxt.dev/guide/essentials/config/runtime.html
 */
export function useAppConfig(): WxtAppConfig {
  // After v1.0 this function will be removed, and migrate to use only `getAppConfig` instead.
  if (import.meta.env.DEV) {
    console.warn(
      '[wxt] `useAppConfig` is deprecated. Please use `getAppConfig` instead.',
    );
  }

  return getAppConfig();
}
