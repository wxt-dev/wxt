/// <reference types="chrome" />

export interface WxtRuntime {
  // Overriden per-project
}
export interface WxtI18n {
  // Overriden per-project
}

type Chrome = typeof chrome;
export type WxtBrowser = Omit<Chrome, 'runtime' | 'i18n'> & {
  runtime: WxtRuntime & Omit<Chrome['runtime'], 'getURL'>;
  i18n: WxtI18n & Omit<Chrome['i18n'], 'getMessage'>;
};

export const browser: WxtBrowser =
  // @ts-expect-error
  globalThis.browser?.runtime?.id == null
    ? globalThis.chrome
    : // @ts-expect-error
      globalThis.browser;
