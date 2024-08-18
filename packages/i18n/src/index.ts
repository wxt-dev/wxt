import {
  I18nStructure,
  DefaultI18nStructure,
  I18n,
  Substitution,
} from './types';

export function createI18n<
  T extends I18nStructure = DefaultI18nStructure,
>(): I18n<T> {
  const t = (key: string, ...args: any[]) => {
    // Resolve args
    let sub: Substitution[] | undefined;
    let count: number | undefined;
    switch (typeof args[0]) {
      case 'number':
        count = args[0];
        sub = args[1] ?? [count];
        break;
      case 'object':
        sub = args[0];
        break;
      case 'undefined':
        break;
      default:
        throw Error(
          'Second parameter must be a number or an array, got ' +
            typeof args[0],
        );
    }

    // Load the localization
    let message: string;
    if (sub?.length) {
      // Convert all substitutions to strings
      const stringSubs = sub?.map((sub) => String(sub));
      message = chrome.i18n.getMessage(key.replaceAll('.', '_'), stringSubs);
    } else {
      message = chrome.i18n.getMessage(key.replaceAll('.', '_'));
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
