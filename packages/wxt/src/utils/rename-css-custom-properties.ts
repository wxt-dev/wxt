/** @module wxt/utils/rename-css-custom-properties */

/**
 * Options for renaming CSS custom properties.
 */
export interface CssPropertyPrefixOptions {
  /**
   * The original prefix to match and replace.
   * @example '--tw-'
   */
  fromPrefix: string;
  /**
   * The new prefix to use as replacement.
   * @example '--wxt-tw-'
   */
  toPrefix: string;
}

/**
 * Renames CSS custom properties in a CSS string.
 *
 * This function handles three types of CSS custom property occurrences:
 * 1. `@property` rules: `@property {fromPrefix}xxx { ... }` → `@property {toPrefix}xxx { ... }`
 * 2. Property declarations: `{fromPrefix}xxx: value` → `{toPrefix}xxx: value`
 * 3. `var()` references: `var({fromPrefix}xxx)` → `var({toPrefix}xxx)`
 *
 * @param css - The CSS string to process
 * @param options - The prefix options
 * @returns The CSS string with renamed custom properties
 *
 * @example
 * ```ts
 * const css = `
 *   @property --tw-gradient-from { syntax: "<color>"; }
 *   .class { --tw-gradient-from: red; background: var(--tw-gradient-from); }
 * `;
 * const result = renameCssCustomProperties(css, {
 *   fromPrefix: '--tw-',
 *   toPrefix: '--wxt-tw-'
 * });
 * // Result:
 * // @property --wxt-tw-gradient-from { syntax: "<color>"; }
 * // .class { --wxt-tw-gradient-from: red; background: var(--wxt-tw-gradient-from); }
 * ```
 */
export function renameCssCustomProperties(
  css: string,
  options: CssPropertyPrefixOptions,
): string {
  const { fromPrefix, toPrefix } = options;

  if (!fromPrefix || !toPrefix) {
    throw new Error(
      'cssPropertyRename requires both "fromPrefix" and "toPrefix" to be specified',
    );
  }

  // Escape special regex characters in the prefix
  const escapedFromPrefix = fromPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fromPrefixLength = fromPrefix.length;

  // Combined regex matching all three patterns in a single pass:
  // 1. @property --prefix-xxx
  // 2. --prefix-xxx: (declaration)
  // 3. var(--prefix-xxx
  const combinedRegex = new RegExp(
    `(@property\\s+)(${escapedFromPrefix}[\\w-]*)|(${escapedFromPrefix}[\\w-]*)(\\s*:)|(var\\(\\s*)(${escapedFromPrefix}[\\w-]*)`,
    'g',
  );

  return css.replace(
    combinedRegex,
    (
      match,
      atPropertyPrefix,
      atPropertyName,
      declareName,
      colonPart,
      varPrefix,
      varName,
    ) => {
      if (atPropertyPrefix !== undefined) {
        // @property rule: @property --tw-xxx
        return (
          atPropertyPrefix + toPrefix + atPropertyName.slice(fromPrefixLength)
        );
      }
      if (declareName !== undefined) {
        // Property declaration: --tw-xxx: value
        return toPrefix + declareName.slice(fromPrefixLength) + colonPart;
      }
      if (varPrefix !== undefined) {
        // var() reference: var(--tw-xxx)
        return varPrefix + toPrefix + varName.slice(fromPrefixLength);
      }
      return match;
    },
  );
}
