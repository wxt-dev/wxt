/**
 * @module wxt/browser
 */
import originalBrowser from 'webextension-polyfill';
import * as WebextensionPolyfill from 'webextension-polyfill';

export { WebextensionPolyfill };

export interface AugmentedBrowser extends WebextensionPolyfill.Browser {
  runtime: WxtRuntime;
  i18n: WxtI18n;
}

export interface WxtRuntime extends WebextensionPolyfill.Runtime.Static {
  // Overriden per-project
}

export interface WxtI18n extends WebextensionPolyfill.I18n.Static {
  // Overriden per-project
}

export const browser: AugmentedBrowser = originalBrowser;
