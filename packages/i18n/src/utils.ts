import { ChromeMessage } from './build';

export function applyChromeMessagePlaceholders(message: ChromeMessage): string {
  if (message.placeholders == null) return message.message;

  return Object.entries(message.placeholders ?? {}).reduce(
    (text, [name, value]) => {
      return text.replaceAll(new RegExp(`\\$${name}\\$`, 'gi'), value.content);
    },
    message.message,
  );
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

  const prefix = locale.substring(0, 2);
  const suffix = locale.substring(3);
  return `${prefix.toLowerCase()}_${suffix.toUpperCase()}`;
}
