/** @module @wxt-dev/i18n */
import type {
  I18nStructure,
  I18n,
  NamedSubstitutions,
  Substitution,
  UntypedI18n,
} from './types';
import { browser } from '@wxt-dev/browser';
import { applyNamedSubstitutions } from './utils';

export function createI18n(): UntypedI18n;
export function createI18n<T extends I18nStructure>(): I18n<T>;
export function createI18n(): UntypedI18n {
  const t: UntypedI18n['t'] = (key: string, ...args: unknown[]) => {
    // Resolve args
    let sub: Substitution[] | undefined;
    let namedSub: NamedSubstitutions | undefined;
    let count: number | undefined;
    args.forEach((arg, i) => {
      if (arg == null) {
        // ignore nullish args
      } else if (typeof arg === 'number') {
        count = arg;
      } else if (Array.isArray(arg)) {
        sub = arg;
      } else if (isNamedSubstitutions(arg)) {
        namedSub = arg;
      } else {
        throw Error(
          `Unknown argument at index ${i}. Must be a number for pluralization, substitution array, or named substitution object.`,
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
      message = browser.i18n.getMessage(key.replaceAll('.', '_'), stringSubs);
    } else {
      message = browser.i18n.getMessage(key.replaceAll('.', '_'));
    }
    if (!message) {
      console.warn(`[i18n] Message not found: "${key}"`);
    }

    if (count != null) {
      // Apply pluralization
      const plural = message.split(' | ');
      switch (plural.length) {
        // "n items"
        case 1:
          message = plural[0];
          break;
        // "1 item | n items"
        case 2:
          message = plural[count === 1 ? 0 : 1];
          break;
        // "0 items | 1 item | n items"
        case 3:
          message = plural[count === 0 || count === 1 ? count : 2];
          break;
        default:
          throw Error('Unknown plural formatting');
      }
    }

    return namedSub == null
      ? message
      : applyNamedSubstitutions(message, namedSub);
  };

  return { t };
}

function isNamedSubstitutions(value: unknown): value is NamedSubstitutions {
  return typeof value === 'object' && value != null;
}
