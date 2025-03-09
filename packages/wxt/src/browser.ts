/// <reference types="chrome" />
/// <reference types="@wxt-dev/types-test/lib/index.d.ts" />

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

export type WxtBrowser = Omit<typeof browser, 'runtime' | 'i18n'> & {
  runtime: WxtRuntime & Omit<(typeof browser)['runtime'], 'getURL'>;
  i18n: WxtI18n & Omit<(typeof browser)['i18n'], 'getMessage'>;
};

/* // #region snippet
// @ts-expect-error
globalThis.browser?.runtime?.id == null
    ? globalThis.chrome
    : // @ts-expect-error
      globalThis.browser
// #endregion snippet */

/* const browser = (globalThis.browser?.runtime?.id == null
  ? globalThis.chrome
  : globalThis.browser) as any as typeof globalThis.browser; */

type test = browser.runtime.MessageSender;
//     ^?
browser.runtime.connect();
//                ^?
browser.runtime.onMessage;
//                ^?
browser.runtime.onMessage.addListener;
//                          ^?
chrome.runtime.onMessage.addListener;
//                            ^?

browser.runtime.onMessage.addListener();
