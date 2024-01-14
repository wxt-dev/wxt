import { browser } from '~/browser';

export interface DefaultMessageSchema {
  t: {
    [key: string]: string[] | undefined;
  };
  tp: {
    [key: string]: string[] | undefined;
  };
}

export function createExtensionI18n<
  TMessageSchema = unknown,
>(): ExtensionI18n<TMessageSchema> {
  const untyped: UntypedExtensionI18n = {
    t(key, substitutions) {
      return browser.i18n.getMessage(key, substitutions);
    },
    tp(key, count, substitutions) {
      const plural = browser.i18n
        .getMessage(key as string, substitutions)
        .split(' | ');

      // "n items"
      if (plural.length === 1) return plural[0];

      // "1 item | n items"
      if (plural.length === 2) {
        if (count === 1) return plural[0];
        return plural[1];
      }

      // "0 items | 1 item | n items"
      if (count === 0 || count === 1) return plural[count];
      return plural[2];
    },
  };
  return untyped as ExtensionI18n<TMessageSchema>;
}

export type ExtensionI18n<TMessageSchema> =
  TMessageSchema extends DefaultMessageSchema
    ? TypedExtensionI18n<TMessageSchema>
    : UntypedExtensionI18n;

export interface TypedExtensionI18n<
  TMessageSchema extends DefaultMessageSchema,
> {
  t<TKey extends KeysWithoutSub<TMessageSchema['t']>>(key: TKey): string;
  t<TKey extends KeysWithSub<TMessageSchema['t']>>(
    key: TKey,
    substitutions: TMessageSchema['t'][TKey],
  ): string;

  tp<TKey extends KeysWithoutSub<TMessageSchema['tp']>>(
    key: TKey,
    count: number,
  ): string;
  tp<TKey extends KeysWithSub<TMessageSchema['tp']>>(
    key: TKey,
    count: number,
    substitutions: TMessageSchema['tp'][TKey],
  ): string;
}

export interface UntypedExtensionI18n {
  t(key: string, substitutions?: string[]): string;
  tp(key: string, count: number, substitutions?: string[]): string;
}

type FilterKeys<TObject, TFilterType> = {
  [K in keyof TObject]-?: TObject[K] extends TFilterType ? K : never;
}[keyof TObject];
type KeysWithSub<TObject> = FilterKeys<TObject, string[]>;
type KeysWithoutSub<TObject> = FilterKeys<TObject, undefined>;
