/// <reference types="chrome" />
/**
 * EXPERIMENTAL
 *
 * Includes the `chrome` API and types when using `extensionApi: 'chrome'`.
 *
 * @module wxt/browser/chrome
 */
import type { WxtRuntime, WxtI18n } from './index';

export type WxtBrowser = Omit<typeof chrome, 'runtime' | 'i18n'> & {
  runtime: WxtRuntime & Omit<(typeof chrome)['runtime'], 'getURL'>;
  i18n: WxtI18n & Omit<(typeof chrome)['i18n'], 'getMessage'>;
};

export const browser: WxtBrowser =
  // @ts-expect-error
  globalThis.browser?.runtime?.id == null
    ? globalThis.chrome
    : // @ts-expect-error
      globalThis.browser;
