// #region snippet
export const browser =
  import.meta.env.FIREFOX || import.meta.env.SAFARI
    ? globalThis.browser
    : globalThis.chrome
// #endregion snippet
