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
  TMessageSchema extends DefaultMessageSchema = DefaultMessageSchema,
>(): ExtensionI18n<TMessageSchema> {
  return {
    t(key: string, substitutions?: string[]) {
      return browser.i18n.getMessage(key as string, substitutions);
    },
    tp(key: string, count: number, substitutions?: string[]) {
      const plural = browser.i18n
        .getMessage(key as string, substitutions)
        .split(' | ');
      return plural[count] || plural.at(-1)!;
    },
  };
}

export interface ExtensionI18n<TMessageSchema extends DefaultMessageSchema> {
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

type FilterKeys<TObject, TFilterType> = {
  [K in keyof TObject]-?: TObject[K] extends TFilterType ? K : never;
}[keyof TObject];
type KeysWithSub<TObject> = FilterKeys<TObject, string[]>;
type KeysWithoutSub<TObject> = FilterKeys<TObject, undefined>;
