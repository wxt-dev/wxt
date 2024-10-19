export interface I18nFeatures {
  plural: boolean;
  substitutions: SubstitutionCount;
}

export type I18nStructure = {
  [K: string]: I18nFeatures;
};

export type DefaultI18nStructure = {
  [K: string]: any;
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

export type TFunction<T extends I18nStructure> = {
  // Non-plural, no substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: 0 } ? P : never; }[keyof T],
  ): string;

  // Non-plural with substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: SubstitutionCount } ? P : never; }[keyof T],
    substitutions: T[K] extends I18nFeatures
      ? SubstitutionTuple<T[K]['substitutions']>
      : never,
  ): string;

  // Plural with 1 substitution
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: 1 } ? P : never; }[keyof T],
    n: number,
    substitutions?: SubstitutionTuple<1>,
  ): string;

  // Plural without substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: 0 | 1 } ? P : never; }[keyof T],
    n: number,
  ): string;

  // Plural with substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: SubstitutionCount } ? P : never; }[keyof T],
    n: number,
    substitutions: T[K] extends I18nFeatures
      ? SubstitutionTuple<T[K]['substitutions']>
      : never,
  ): string;
};

export interface I18n<T extends DefaultI18nStructure> {
  t: TFunction<T>;
}

export type Substitution = string | number;

type SubstitutionCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
