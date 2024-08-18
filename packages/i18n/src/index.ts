import {
  I18nStructure,
  DefaultI18nStructure,
  I18n,
  Substitution,
  GetMessageOptions,
} from './types';

export function createI18n<
  T extends I18nStructure = DefaultI18nStructure,
>(): I18n<T> {
  const t = (key: string, ...args: any[]) => {
    // Resolve args
    let sub: Substitution[] | undefined;
    let count: number | undefined;
    let options: GetMessageOptions | undefined;
    args.forEach((arg, i) => {
      if (typeof arg === 'number') {
        count = arg;
      } else if (Array.isArray(arg)) {
        sub = arg;
      } else if (typeof arg === 'object' && arg != null) {
        options = arg;
      } else {
        throw Error(
          `Unknown argument at index ${i}. Must be a number for pluralization, substitution array, or options object.`,
        );
      }
    });

    // Default substitutions to [n]
    if (count != null && sub == null) {
      sub = [String(count)];
    }

    // Load the localization
    let message: string;
    if (sub?.length) {
      // Convert all substitutions to strings
      const stringSubs = sub?.map((sub) => String(sub));
      message = chrome.i18n.getMessage(
        key.replaceAll('.', '_'),
        stringSubs,
        // @ts-ignore - @types/chrome doesn't type the options object, but it's there
        options,
      );
    } else {
      message = chrome.i18n.getMessage(
        key.replaceAll('.', '_'),
        // @ts-ignore - @types/chrome doesn't type the options object, but it's there
        options,
      );
    }
    if (!message) {
      console.warn(`[i18n] Message not found for i18n.t("${key}")`);
    }
    if (count == null) return message;

    // Apply pluralization
    const plural = message.split(' | ');
    switch (plural.length) {
      // "n items"
      case 1:
        return plural[0];
      // "1 item | n items"
      case 2:
        return plural[count === 1 ? 0 : 1];
      // "0 items | 1 item | n items"
      case 3:
        return plural[count === 0 || count === 1 ? count : 2];
      default:
        throw Error('Unknown plural formatting');
    }
  };

  return { t } as I18n<T>;
}
