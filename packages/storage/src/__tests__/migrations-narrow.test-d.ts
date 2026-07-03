/**
 * Migrations tuple: narrow chain-checked shape flows into defineItem.
 *
 * Before `TMigrations` capture: hovering `migrations` inside the `defineItem`
 * options bag showed `readonly [MigrationFn, MigrationFn]` — the tuple length
 * was correct (via `MigrationTuple<TVersion>`) but each slot displayed as the
 * bare `MigrationFn` alias (`(oldValue: any) => unknown | Promise<unknown>`),
 * hiding the actual per-slot signatures produced by `defineMigrations`.
 *
 * After: each `defineItem` overload declares
 *
 * Const TMigrations extends MigrationTuple<TVersion> =
 * MigrationTuple<TVersion>,
 *
 * And the options intersection is
 *
 * Omit<WxtStorageItemOptions<...>, 'migrations'> & { migrations?: TMigrations;
 * ... }
 *
 * With `<const TMigrations>` capture and the base interface's `migrations`
 * omitted, the narrow tuple type from `defineMigrations` (or a raw literal
 * array) is preserved at the options-bag boundary. Hover now shows each fn's
 * actual `(v: unknown) => BookmarkFolder` / `(v: BookmarkFolder) => ...`
 * signature.
 *
 * The `MigrationTuple<TVersion>` constraint retains the length lock so
 * `version: 3` still requires exactly 2 slots.
 */
import { expectTypeOf, describe, it } from 'vitest';
import { storage, defineMigrations } from '../index';
import type { MigrationTuple } from '../types';

type BookmarkFolder = { label: string; urls: string[] };

describe('migrations tuple preserves chain-checked signatures', () => {
  it('defineMigrations return type has narrow per-slot fn signatures', () => {
    const migs = defineMigrations<BookmarkFolder>()(
      (v: unknown): BookmarkFolder => ({
        label: 'Untitled',
        urls: Array.isArray(v) ? (v as string[]) : [],
      }),
      (v): BookmarkFolder => ({ ...v, urls: [...new Set(v.urls)] }),
    );

    expectTypeOf(migs).toEqualTypeOf<
      readonly [
        (v: unknown) => BookmarkFolder | Promise<BookmarkFolder>,
        (v: BookmarkFolder) => BookmarkFolder | Promise<BookmarkFolder>,
      ]
    >();
  });

  it('length-lock is enforced at the migrations-tuple type', () => {
    // Prove the type-level constraint holds without depending on
    // vitest-typecheck's `@ts-expect-error` positioning (which is finicky for
    // errors nested inside multi-line call expressions). MigrationTuple<3>
    // resolves to a length-2 tuple; a length-1 tuple is not assignable.
    type _lengthLock =
      readonly [(v: unknown) => number] extends MigrationTuple<3>
        ? never
        : true;
    expectTypeOf<_lengthLock>().toEqualTypeOf<true>();

    // And a length-2 tuple IS assignable.
    type _lengthOK =
      readonly [
        (v: unknown) => number,
        (v: number) => number,
      ] extends MigrationTuple<3>
        ? true
        : never;
    expectTypeOf<_lengthOK>().toEqualTypeOf<true>();
  });

  it('length-lock accepts the correct tuple length', () => {
    storage.defineItem('local:count', {
      fallback: 0,
      version: 3,
      migrations: [
        (v: unknown): number => Number(v),
        (v: number): number => v + 1,
      ],
    });
  });

  it('accepts either raw tuple or defineMigrations output', () => {
    // Raw tuple form
    const rawForm = storage.defineItem('local:count', {
      fallback: 0,
      version: 2,
      migrations: [(v: unknown): number => Number(v)],
    });
    expectTypeOf(rawForm.version).toEqualTypeOf<2>();

    // Chain-checked helper form
    const helperForm = storage.defineItem('local:count', {
      fallback: 0,
      version: 2,
      migrations: defineMigrations<number>()((v: unknown): number => Number(v)),
    });
    expectTypeOf(helperForm.version).toEqualTypeOf<2>();
  });

  it('version:0 does not blow up the type checker (invalid but tolerable)', () => {
    // `version: 0` is a runtime error but MUST NOT cause a type-instantiation
    // infinite loop. `MigrationTuple<0>` short-circuits to `readonly []` via
    // the `V extends 0 | 1 ? readonly [] : ...` guard in types.ts. Without
    // that guard, `Subtract<0, 1>` produces `never`, `BuildTuple<never>`
    // recurses forever, and vitest's typecheck aborts with TS2589.
    //
    // No expectTypeOf here — we're proving compile-time termination, which
    // only manifests as the ABSENCE of a "Type instantiation is excessively
    // deep and possibly infinite" error.
    const item = () =>
      storage.defineItem('local:key', { fallback: 0, version: 0 });
    expectTypeOf(item).returns.toBeObject();
  });
});
