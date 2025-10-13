/** @module wxt/utils/split-shadow-root-css */

const AT_RULE_BLOCKS = /(\s*@(property|font-face)[\s\S]*?{[\s\S]*?})/gm;

/**
 * Given a CSS string that will be loaded into a shadow root, split it into two parts:
 * - `documentCss`: CSS that needs to be applied to the document (like `@property`)
 * - `shadowCss`: CSS that needs to be applied to the shadow root
 * @param css
 */
export function splitShadowRootCss(css: string): {
  documentCss: string;
  shadowCss: string;
} {
  const documentCss = Array
    .from(css.matchAll(AT_RULE_BLOCKS), (m) => m[0])
    .join("")
    .trim();
  const shadowCss = css
    .replace(AT_RULE_BLOCKS, "")
    .trim();

  return {
    documentCss: documentCss,
    shadowCss: shadowCss,
  };
}
