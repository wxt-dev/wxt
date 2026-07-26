import type { ChromeMessage } from './build';
import type { NamedSubstitutions } from './types';

const NAMED_SUBSTITUTION_RE = /\{([A-Za-z0-9_]+)\}/g;

export function applyChromeMessagePlaceholders(message: ChromeMessage): string {
  if (message.placeholders == null) return message.message;

  return Object.entries(message.placeholders ?? {}).reduce(
    (text, [name, value]) => {
      return text.replaceAll(new RegExp(`\\$${name}\\$`, 'gi'), value.content);
    },
    message.message,
  );
}

export function applyNamedSubstitutions(
  message: string,
  substitutions: NamedSubstitutions,
): string {
  return message.replace(NAMED_SUBSTITUTION_RE, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(substitutions, key)
      ? String(substitutions[key])
      : match;
  });
}

export function getNamedSubstitutionNames(message: string): string[] {
  return Array.from(
    message.matchAll(NAMED_SUBSTITUTION_RE),
    ([, name]) => name,
  ).filter((name, i, names) => names.indexOf(name) === i);
}

export function getSubstitutionCount(message: string): number {
  return (
    1 +
    Array.from({ length: MAX_SUBSTITUTIONS }).findLastIndex((_, i) =>
      message.match(new RegExp(`(?<!\\$)\\$${i + 1}`)),
    )
  );
}

const MAX_SUBSTITUTIONS = 9;

/** Given a string, standardize it to the format `xx_YY`. */
export function standardizeLocale(locale: string): string {
  if (locale.length === 2) return locale.toLowerCase();

  const [is_match, prefix, suffix] =
    locale.match(/^([a-z]{2})[-_]([a-z]{2,3})$/i) ?? [];
  if (is_match) {
    return `${prefix.toLowerCase()}_${suffix.toUpperCase()}`;
  }

  return locale;
}
