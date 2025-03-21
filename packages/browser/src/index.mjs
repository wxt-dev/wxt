// #region snippet
export const browser = !!globalThis.browser?.runtime?.id
  ? globalThis.browser
  : globalThis.chrome;
// #endregion snippet
