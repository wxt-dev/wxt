/**
 * Contains the `browser` export which you should use to access the extension APIs in your project:
 * ```ts
 * import { browser } from 'wxt/browser';
 *
 * browser.runtime.onInstalled.addListener(() => {
 *   // ...
 * })
 * ```
 * @module wxt/browser
 */
import { browser as _browser, type Browser } from '@wxt-dev/browser';

/**
 * This interface is empty because it is generated per-project when running `wxt prepare`. See:
 * - `.wxt/types/paths.d.ts`
 */
export interface WxtRuntime {}

/**
 * This interface is empty because it is generated per-project when running `wxt prepare`. See:
 * - `.wxt/types/i18n.d.ts`
 */
export interface WxtI18n {}

export type WxtBrowser = Omit<typeof _browser, 'runtime' | 'i18n'> & {
  runtime: WxtRuntime & Omit<(typeof _browser)['runtime'], 'getURL'>;
  i18n: WxtI18n & Omit<(typeof _browser)['i18n'], 'getMessage'>;
};

export const browser: WxtBrowser = _browser;

export { Browser };
