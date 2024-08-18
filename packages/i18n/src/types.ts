export interface I18nFeatures {
  plural: boolean;
  substitutions: number;
}

export type DefaultI18nStructure = {
  [K: string]: I18nFeatures;
};

// Helper type to create tuples of specific length
type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

export type TFunction<T extends DefaultI18nStructure> = {
  // Non-plural, no substitutions
  <K extends keyof T>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: 0 } ? P : never; }[keyof T],
    options?: GetMessageOptions,
  ): string;

  // Non-plural with substitutions
  <K extends keyof T, S extends number>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: false; substitutions: S } ? P : never; }[keyof T],
    substitutions: Tuple<Substitution, S>,
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
  <K extends keyof T, S extends number>(
    // prettier-ignore
    key: K & { [P in keyof T]: T[P] extends { plural: true; substitutions: S } ? P : never; }[keyof T],
    n: number,
    substitutions: Tuple<Substitution, S>,
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
