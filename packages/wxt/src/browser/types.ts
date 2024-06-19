import type { Browser, Runtime, I18n } from 'webextension-polyfill';

export interface AugmentedBrowser extends Browser {
  runtime: WxtRuntime;
  i18n: WxtI18n;
}

export interface WxtRuntime extends Runtime.Static {
  // Overriden per-project
}

export interface WxtI18n extends I18n.Static {
  // Overriden per-project
}
