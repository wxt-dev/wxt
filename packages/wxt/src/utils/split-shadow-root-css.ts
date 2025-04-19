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
  let shadowCss = css;
  let documentCss = '';

  const rulesRegex = /(\s*@property[\s\S]*?{[\s\S]*?})/gm;
  let match;
  while ((match = rulesRegex.exec(css)) !== null) {
    documentCss += match[1];
    console.log(match[1]);
    shadowCss = shadowCss.replace(match[1], '');
  }

  return {
    documentCss: documentCss.trim(),
    shadowCss: shadowCss.trim(),
  };
}
