export interface I18nFeatures {
  plural: boolean;
  substitutions: SubstitutionCount;
}

export type DefaultI18nStructure = {
  [K: string]: I18nFeatures;
};

// prettier-ignore
export type SubstitutionTuple<T extends SubstitutionCount> =
    T extends 1 ? [$1: Substitution]
  : T extends 2 ? [$1: Substitution, $2: Substitution]
  : T extends 3 ? [$1: Substitution, $2: Substitution, $3: Substitution]
  : T extends 4 ? [$1: Substitution, $2: Substitution, $3: Substitution, $4: Substitution]
  : T extends 5 ? [$1: Substitution, $2: Substitution, $3: Substitution, $4: Substitution, $5: Substitution]
  : T extends 6 ? [$1: Substitution, $2: Substitution, $3: Substitution, $4: Substitution, $5: Substitution, $6: Substitution]
  : T extends 7 ? [$1: Substitution, $2: Substitution, $3: Substitution, $4: Substitution, $5: Substitution, $6: Substitution, $7: Substitution]
  : T extends 8 ? [$1: Substitution, $2: Substitution, $3: Substitution, $4: Substitution, $5: Substitution, $6: Substitution, $7: Substitution, $8: Substitution]
  : T extends 9 ? [$1: Substitution, $2: Substitution, $3: Substitution, $4: Substitution, $5: Substitution, $6: Substitution, $7: Substitution, $8: Substitution, $9: Substitution]
  : never

export type TFunction<T extends DefaultI18nStructure> = {
  // Non-plural, no substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: 0 } ? P : never; }[keyof T],
    options?: GetMessageOptions,
  ): string;

  // Non-plural with substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: SubstitutionCount } ? P : never; }[keyof T],
    substitutions: T[K]['substitutions'] extends SubstitutionCount
      ? SubstitutionTuple<T[K]['substitutions']>
      : never,
    options?: GetMessageOptions,
  ): string;

  // Plural without substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: 0 } ? P : never; }[keyof T],
    n: number,
    options?: GetMessageOptions,
  ): string;

  // Plural with substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: SubstitutionCount } ? P : never; }[keyof T],
    n: number,
    substitutions: T[K]['substitutions'] extends SubstitutionCount
      ? SubstitutionTuple<T[K]['substitutions']>
      : never,
    options?: GetMessageOptions,
  ): string;
};

export interface I18n<T extends DefaultI18nStructure> {
  t: TFunction<T>;
}

export type Substitution = string | number;

export interface GetMessageOptions {
  /**
   * Escape `<` in translation to `&lt;`. This applies only to the message itself, not to the placeholders. Developers might want to use this if the translation is used in an HTML context. Closure Templates used with Closure Compiler generate this automatically.
   *
   * See https://developer.chrome.com/docs/extensions/reference/api/i18n#type-getMessage-options
   */
  escapeLt?: boolean;
}

type SubstitutionCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
