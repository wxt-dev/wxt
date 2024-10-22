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
