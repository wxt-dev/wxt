/** @module wxt/utils/split-shadow-root-css */

const AT_RULE_BLOCKS = /(\s*@(property|font-face)[\s\S]*?{[\s\S]*?})/gm;
const REGISTERED_PROPERTY_NAMES = /@property\s+(--[-_a-zA-Z0-9]+)\s*{/g;

export interface SplitShadowRootCssOptions {
  /** Prefix applied to custom properties registered by `@property` rules. */
  propertyPrefix?: string;
}

/**
 * Given a CSS string that will be loaded into a shadow root, split it into two
 * parts:
 *
 * - `documentCss`: CSS that needs to be applied to the document (like
 *   `@property`)
 * - `shadowCss`: CSS that needs to be applied to the shadow root
 *
 * @param css
 */
export function splitShadowRootCss(
  css: string,
  options: SplitShadowRootCssOptions = {},
): {
  documentCss: string;
  shadowCss: string;
} {
  css = scopeRegisteredProperties(css, options.propertyPrefix);

  const documentCss = Array.from(css.matchAll(AT_RULE_BLOCKS), (m) => m[0])
    .join('')
    .trim();
  const shadowCss = css.replace(AT_RULE_BLOCKS, '').trim();

  return {
    documentCss: documentCss,
    shadowCss: shadowCss,
  };
}

function scopeRegisteredProperties(css: string, prefix: string | undefined) {
  if (!prefix) return css;

  const propertyNames = Array.from(
    new Set(
      Array.from(css.matchAll(REGISTERED_PROPERTY_NAMES), (match) => match[1]),
    ),
  ).sort((a, b) => b.length - a.length);
  if (propertyNames.length === 0) return css;

  const propertyPattern = new RegExp(
    `${propertyNames.map(escapeRegExp).join('|')}(?![-_a-zA-Z0-9])`,
    'g',
  );
  const normalizedPrefix = prefix.replace(/^--+/, '').replace(/-+$/, '');
  if (!normalizedPrefix) return css;

  return css.replace(
    propertyPattern,
    (propertyName) => `--${normalizedPrefix}-${propertyName.slice(2)}`,
  );
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
