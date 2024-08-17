export function createI18n<TI18n extends I18n = I18n>(): TI18n {
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

  return { t } as TI18n;
}

export type Substitution = string | number;

export interface I18n {
  t(key: I18nSimpleMessage): string;
  t(key: I18nWithSubstitutionsMessage, substitutions: Substitution[]): string;
  t(key: I18nPluralMessage, count: number): string;
  t(
    key: I18nPluralWithSubstitutionsMessage,
    count: number,
    substitutions: Substitution[],
  ): string;
}

// export type I18nMessages = {
//   simple: string;
//   withSubstitutions: string;
//   plural: string;
//   pluralWithSubstitutions: string;
// };

export type I18nSimpleMessage = string;
export type I18nWithSubstitutionsMessage = string;
export type I18nPluralMessage = string;
export type I18nPluralWithSubstitutionsMessage = string;
