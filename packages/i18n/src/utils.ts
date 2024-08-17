import { ChromeMessage, ParsedMessage } from './build';

export function applyChromeMessagePlaceholders(message: ChromeMessage): string {
  if (message.placeholders == null) return message.message;

  return Object.entries(message.placeholders ?? {}).reduce(
    (text, [name, value]) => {
      return text.replaceAll(new RegExp(`\\$${name}\\$`, 'gi'), value.content);
    },
    message.message,
  );
}

export function getSubstitionCount(
  message: ParsedMessage | ChromeMessage | string,
): number {
  const text =
    typeof message === 'string'
      ? message
      : !('type' in message) || message.type === 'chrome'
        ? applyChromeMessagePlaceholders(message)
        : message.type === 'plural'
          ? Object.values(message.plurals).join('|')
          : message.message;
  return (
    1 +
    new Array(MAX_SUBSTITUTIONS).findLastIndex((_, i) =>
      text.match(new RegExp(`(?<!\\$)\\$${i + 1}`)),
    )
  );
}

const MAX_SUBSTITUTIONS = 9;
