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
import type { ScriptPublicPath } from './utils/inject-script';

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

type ScriptInjection<Args extends any[], Result> =
  Browser.scripting.ScriptInjection<Args, Result> extends infer T
    ? T extends { files: string[] }
      ? Omit<T, 'files'> & { files: ScriptPublicPath[] }
      : T
    : never;
type InjectionResult<Result> = Array<
  Browser.scripting.InjectionResult<Awaited<Result>>
>;

export interface WxtScripting {
  executeScript: {
    /**
     * @see {@link Browser.scripting.executeScript}
     */
    <Args extends any[], Result>(
      injection: ScriptInjection<Args, Result>,
    ): Promise<InjectionResult<Result>>;
    <Args extends any[], Result>(
      injection: ScriptInjection<Args, Result>,
      callback: (results: InjectionResult<Result>) => void,
    ): void;
  };
}

export type WxtBrowser = Omit<
  typeof _browser,
  'runtime' | 'i18n' | 'scripting'
> & {
  runtime: WxtRuntime & Omit<(typeof _browser)['runtime'], 'getURL'>;
  i18n: WxtI18n & Omit<(typeof _browser)['i18n'], 'getMessage'>;
  scripting: WxtScripting &
    Omit<(typeof _browser)['scripting'], 'executeScript'>;
};

export const browser: WxtBrowser = _browser;

export { Browser };
