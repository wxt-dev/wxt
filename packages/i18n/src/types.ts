export interface I18nFeatures {
  plural: boolean;
  substitutions: SubstitutionCount;
  namedSubstitutions?: readonly string[];
}

export interface UntypedI18n {
  t: UntypedTFunction;
}

export type UntypedTFunction = {
  (key: string): string;
  (key: string, substitutions: Substitution[]): string;
  (key: string, substitutions: NamedSubstitutions): string;
  (
    key: string,
    substitutions: Substitution[],
    namedSubstitutions: NamedSubstitutions,
  ): string;
  (key: string, n: number): string;
  (key: string, n: number, substitutions: Substitution[]): string;
  (key: string, n: number, substitutions: NamedSubstitutions): string;
  (
    key: string,
    n: number,
    substitutions: Substitution[],
    namedSubstitutions: NamedSubstitutions,
  ): string;
};

export type I18nStructure = Record<string, I18nFeatures>;

export interface I18n<T extends I18nStructure> {
  t: TFunction<T>;
}

type HasNamedSubstitutions<T extends I18nFeatures> = T extends {
  namedSubstitutions: readonly string[];
}
  ? true
  : false;

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
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: 0 } ? HasNamedSubstitutions<T[P]> extends true ? never : P : never; }[keyof T],
  ): string;

  // Non-plural with substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: SubstitutionCount } ? HasNamedSubstitutions<T[P]> extends true ? never : P : never; }[keyof T],
    substitutions: T[K] extends I18nFeatures
      ? SubstitutionTuple<T[K]['substitutions']>
      : never,
  ): string;

  // Non-plural with named substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: 0; namedSubstitutions: readonly string[] } ? P : never; }[keyof T],
    substitutions: T[K] extends I18nFeatures
      ? NamedSubstitutionsFor<T[K]>
      : never,
  ): string;

  // Non-plural with positional and named substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: PositiveSubstitutionCount; namedSubstitutions: readonly string[] } ? P : never; }[keyof T],
    substitutions: T[K] extends I18nFeatures
      ? SubstitutionTuple<T[K]['substitutions']>
      : never,
    namedSubstitutions: T[K] extends I18nFeatures
      ? NamedSubstitutionsFor<T[K]>
      : never,
  ): string;

  // Plural with 1 substitution
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: 1 } ? HasNamedSubstitutions<T[P]> extends true ? never : P : never; }[keyof T],
    n: number,
    substitutions?: SubstitutionTuple<1>,
  ): string;

  // Plural without substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: 0 | 1 } ? HasNamedSubstitutions<T[P]> extends true ? never : P : never; }[keyof T],
    n: number,
  ): string;

  // Plural with substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: SubstitutionCount } ? HasNamedSubstitutions<T[P]> extends true ? never : P : never; }[keyof T],
    n: number,
    substitutions: T[K] extends I18nFeatures
      ? SubstitutionTuple<T[K]['substitutions']>
      : never,
  ): string;

  // Plural with named substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: 0 | 1; namedSubstitutions: readonly string[] } ? P : never; }[keyof T],
    n: number,
    substitutions: T[K] extends I18nFeatures
      ? NamedSubstitutionsFor<T[K]>
      : never,
  ): string;

  // Plural with positional and named substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: PositiveSubstitutionCount; namedSubstitutions: readonly string[] } ? P : never; }[keyof T],
    n: number,
    substitutions: T[K] extends I18nFeatures
      ? SubstitutionTuple<T[K]['substitutions']>
      : never,
    namedSubstitutions: T[K] extends I18nFeatures
      ? NamedSubstitutionsFor<T[K]>
      : never,
  ): string;
};

export type Substitution = string | number;
export type NamedSubstitutions = Record<string, Substitution>;

type SubstitutionCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type PositiveSubstitutionCount = Exclude<SubstitutionCount, 0>;

type NamedSubstitutionsFor<T extends I18nFeatures> = T extends {
  namedSubstitutions: readonly string[];
}
  ? { [K in T['namedSubstitutions'][number]]: Substitution }
  : never;
