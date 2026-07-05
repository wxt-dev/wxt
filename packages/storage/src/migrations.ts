export interface DefineMigrations<TValue> {
  (): readonly [];
  <A extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
  ): readonly [(v: unknown) => A | Promise<A>];
  <A, B extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
  ): readonly [(v: unknown) => A | Promise<A>, (v: A) => B | Promise<B>];
  <A, B, C extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
    f3: (v: B) => C | Promise<C>,
  ): readonly [
    (v: unknown) => A | Promise<A>,
    (v: A) => B | Promise<B>,
    (v: B) => C | Promise<C>,
  ];
  <A, B, C, D extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
    f3: (v: B) => C | Promise<C>,
    f4: (v: C) => D | Promise<D>,
  ): readonly [
    (v: unknown) => A | Promise<A>,
    (v: A) => B | Promise<B>,
    (v: B) => C | Promise<C>,
    (v: C) => D | Promise<D>,
  ];
  <A, B, C, D, E extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
    f3: (v: B) => C | Promise<C>,
    f4: (v: C) => D | Promise<D>,
    f5: (v: D) => E | Promise<E>,
  ): readonly [
    (v: unknown) => A | Promise<A>,
    (v: A) => B | Promise<B>,
    (v: B) => C | Promise<C>,
    (v: C) => D | Promise<D>,
    (v: D) => E | Promise<E>,
  ];
  <A, B, C, D, E, F extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
    f3: (v: B) => C | Promise<C>,
    f4: (v: C) => D | Promise<D>,
    f5: (v: D) => E | Promise<E>,
    f6: (v: E) => F | Promise<F>,
  ): readonly [
    (v: unknown) => A | Promise<A>,
    (v: A) => B | Promise<B>,
    (v: B) => C | Promise<C>,
    (v: C) => D | Promise<D>,
    (v: D) => E | Promise<E>,
    (v: E) => F | Promise<F>,
  ];
  (
    ...migrations: ReadonlyArray<(v: unknown) => unknown | Promise<unknown>>
  ): ReadonlyArray<(v: unknown) => unknown | Promise<unknown>>;
}

/**
 * Chain-checked migrations for `WxtStorageItemOptions.migrations`. Overloads
 * validate that each migration's return type matches the next migration's
 * parameter, and that the final return matches `TValue`. Runtime is an identity
 * wrapper — all work is at the type level.
 */
export function defineMigrations<TValue>(): DefineMigrations<TValue> {
  return ((...migrations: ReadonlyArray<(v: unknown) => unknown>) =>
    migrations) as DefineMigrations<TValue>;
}

export class MigrationError extends Error {
  constructor(key: string, version: number, options?: ErrorOptions) {
    super(`v${version} migration failed for "${key}"`, options);
  }
}
