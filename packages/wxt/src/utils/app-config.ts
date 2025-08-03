/** @module wxt/utils/app-config */
// @ts-expect-error: Untyped virtual module
import appConfig from 'virtual:app-config';
import type { WxtAppConfig } from './define-app-config';

export function useAppConfig(): WxtAppConfig {
  return appConfig;
}
