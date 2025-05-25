// #region snippet
export const browser = globalThis.browser?.runtime?.id
  ? globalThis.browser
  : globalThis.chrome;
export const chrome = globalThis.chrome;
export const firefox = globalThis.browser;
// #endregion snippet
