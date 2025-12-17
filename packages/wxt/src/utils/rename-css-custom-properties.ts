/** @module wxt/utils/rename-css-custom-properties */

/**
 * Options for renaming CSS custom properties.
 */
export interface CssPropertyPrefixOptions {
  /**
   * The original prefix to match and replace.
   * @default ''
   * @example '--tw-'
   */
  fromPrefix?: string;
  /**
   * The new prefix to use as replacement.
   * @default ''
   * @example '--wxt-tw-'
   */
  toPrefix?: string;
}

/**
 * Renames a CSS custom property name if it starts with the specified prefix.
 */
function renamePropertyName(
  propertyName: string,
  fromPrefix: string,
  toPrefix: string,
): string {
  if (!propertyName.startsWith(fromPrefix)) {
    return propertyName;
  }
  return toPrefix + propertyName.slice(fromPrefix.length);
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
  const hasFromPrefix = options.fromPrefix !== undefined;
  const hasToPrefix = options.toPrefix !== undefined;

  // If both are not provided, do nothing
  if (!hasFromPrefix && !hasToPrefix) {
    return css;
  }

  // If fromPrefix is not provided, default to '' (prepend toPrefix to all custom properties)
  // If toPrefix is not provided, default to '' (remove fromPrefix)
  const fromPrefix = options.fromPrefix ?? '';
  const toPrefix = options.toPrefix ?? '';

  // Escape special regex characters in the prefix
  const escapedFromPrefix = fromPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. Rename @property rules: @property --tw-xxx
  // Matches: @property followed by whitespace and a custom property name starting with fromPrefix
  const atPropertyRegex = new RegExp(
    `(@property\\s+)(${escapedFromPrefix}[\\w-]*)`,
    'g',
  );
  let result = css.replace(atPropertyRegex, (_, prefix, propName) => {
    return `${toPrefix}${renamePropertyName(propName, fromPrefix, toPrefix)}`;
  });

  // 2. Rename property declarations: --tw-xxx: value
  // Matches: custom property name starting with fromPrefix, followed by optional whitespace and colon
  const declarationRegex = new RegExp(
    `(${escapedFromPrefix}[\\w-]*)(\\s*:)`,
    'g',
  );
  result = result.replace(declarationRegex, (_, propName, colonPart) => {
    return `${renamePropertyName(propName, fromPrefix, toPrefix)}${colonPart}`;
  });

  // 3. Rename var() references: var(--tw-xxx) or var(--tw-xxx, fallback)
  // Matches: var( followed by optional whitespace and a custom property name starting with fromPrefix
  const varRegex = new RegExp(`(var\\(\\s*)(${escapedFromPrefix}[\\w-]*)`, 'g');
  result = result.replace(varRegex, (_, varPrefix, propName) => {
    return `${varPrefix}${renamePropertyName(propName, fromPrefix, toPrefix)}`;
  });

  return result;
}
