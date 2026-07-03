/**
 * Focused type-only tests for the strictness upgrades (Tier 1 + Tier 2):
 *
 * - `fallback` and `defaultValue` captured as their LITERAL values on `.fallback`
 *   / `.defaultValue` accessors (Tier 1)
 * - `version` captured as its LITERAL number on `.version` accessor and used to
 *   length-lock the `migrations` tuple (Tier 2)
 * - `TValue` (what `.getValue()` returns and `.setValue()` accepts) stays WIDE —
 *   `.setValue(anyNumber)` must still typecheck
 *
 * These use `expectTypeOf` from vitest. They run under `vitest --typecheck` (or
 * `tsc --noEmit`) and produce compile-time failures on drift.
 */

import { describe, it, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { storage, defineSchema } from '../index';

describe('Tier 1 — fallback captured as literal', () => {
  it('narrows .fallback to the literal for non-schema items', () => {
    const item = storage.defineItem('local:x', { fallback: 5 });
    // .fallback narrows to the exact literal 5
    expectTypeOf(item.fallback).toEqualTypeOf<5>();
    // .defaultValue (deprecated alias) mirrors .fallback
    // eslint-disable-next-line deprecation/deprecation
    expectTypeOf(item.defaultValue).toEqualTypeOf<5>();
  });

  it('narrows .fallback for string literals', () => {
    const item = storage.defineItem('local:theme', { fallback: 'system' });
    expectTypeOf(item.fallback).toEqualTypeOf<'system'>();
  });

  it('captures object literal shape on .fallback', () => {
    const item = storage.defineItem('local:cfg', {
      fallback: { count: 0, name: 'root' },
    });
    // Object literals stay narrow enough to remember which keys were present
    expectTypeOf(item.fallback).toMatchTypeOf<{
      count: number;
      name: string;
    }>();
  });

  it('.setValue still accepts the WIDE type (regression guard on Widen<T>)', () => {
    const item = storage.defineItem('local:count', { fallback: 5 });
    // If TValue collapsed to `5`, this would be a type error.
    expectTypeOf(item.setValue).parameter(0).toEqualTypeOf<number>();
    expectTypeOf(item.getValue).returns.resolves.toEqualTypeOf<number>();
  });

  it('narrows .fallback under a Zod schema too', () => {
    const item = storage.defineItem('sync:theme', {
      schema: z.enum(['light', 'dark', 'system']),
      fallback: 'system',
    });
    expectTypeOf(item.fallback).toEqualTypeOf<'system'>();
    // TValue comes from the schema, wide.
    expectTypeOf(item.setValue)
      .parameter(0)
      .toEqualTypeOf<'light' | 'dark' | 'system'>();
  });

  it('narrows .defaultValue (deprecated) as well', () => {
    // eslint-disable-next-line deprecation/deprecation
    const item = storage.defineItem('local:legacy', { defaultValue: 42 });
    // eslint-disable-next-line deprecation/deprecation
    expectTypeOf(item.defaultValue).toEqualTypeOf<42>();
    expectTypeOf(item.fallback).toEqualTypeOf<42>();
  });

  it('.fallback is null when no anchor is provided', () => {
    const bare = storage.defineItem('local:bare');
    expectTypeOf(bare.fallback).toEqualTypeOf<null>();

    const opts = storage.defineItem('local:opts', {});
    expectTypeOf(opts.fallback).toEqualTypeOf<null>();
  });
});

describe('Tier 2 — version captured as literal, migrations length-locked', () => {
  it('narrows .version to the literal number', () => {
    const item = storage.defineItem('local:x', {
      fallback: 0,
      version: 3,
      migrations: [
        (v: unknown): number => Number(v),
        (v: number): number => v * 2,
      ],
    });
    expectTypeOf(item.version).toEqualTypeOf<3>();
  });

  it('defaults .version to `number` when omitted', () => {
    const item = storage.defineItem('local:x', { fallback: 0 });
    expectTypeOf(item.version).toEqualTypeOf<number>();
  });

  it('length-locks migrations to exactly version-1 entries', () => {
    // OK: version 3 with 2 migrations
    storage.defineItem('local:a', {
      fallback: 0,
      version: 3,
      migrations: [
        (v: unknown): number => Number(v),
        (v: number): number => v * 2,
      ],
    });
    // OK: version 1 with 0 migrations
    storage.defineItem('local:b', {
      fallback: 0,
      version: 1,
      migrations: [],
    });
    // OK: version 4 with 3 migrations
    storage.defineItem('local:c', {
      fallback: 0,
      version: 4,
      migrations: [
        (v: unknown): number => Number(v),
        (v: number): number => v * 2,
        (v: number): number => v + 1,
      ],
    });
  });

  it('rejects the WRONG number of migrations', () => {
    // Too few: version 3 needs 2 migrations, we provide 1.
    storage.defineItem('local:bad1', {
      fallback: 0,
      version: 3,
      // @ts-expect-error length mismatch: version 3 requires exactly 2 migrations
      migrations: [(v: unknown): number => Number(v)],
    });

    // Too many: version 2 needs 1 migration, we provide 2.
    // The extra migration fn triggers a "No overload matches this call"
    // where the strict overload rejects the extra tuple element; the
    // `@ts-expect-error` must sit directly before the FIRST offending
    // element (the array literal is checked position-by-position, not as a
    // whole).
    storage.defineItem('local:bad2', {
      fallback: 0,
      version: 2,
      migrations: [
        (v: unknown): number => Number(v),
        // @ts-expect-error length mismatch: version 2 requires exactly 1 migration
        (v: number): number => v + 1,
      ],
    });
  });

  it('degrades to plain array when version is not a literal', () => {
    // `version: n as number` intentionally opts out of the length lock.
    const runtimeVersion: number = 3;
    storage.defineItem('local:x', {
      fallback: 0,
      version: runtimeVersion,
      // Any array length is accepted at this widened surface.
      migrations: [
        (v: unknown): number => Number(v),
        (v: number): number => v * 2,
      ],
    });
  });

  it('narrows onMigrationComplete target to the literal version too', () => {
    const item = storage.defineItem('local:x', {
      fallback: 0,
      version: 5,
      migrations: [
        (v: unknown): number => Number(v),
        (v: number): number => v,
        (v: number): number => v,
        (v: number): number => v,
      ],
      onMigrationComplete: (v, target) => {
        // Design tension noted: `v` here reflects TValue at the options-bag
        // layer, which is captured narrow (`0`) from the `fallback: 0`
        // literal. The RETURN slot uses `Widen<TValue>` = `number` for the
        // item's runtime `getValue`/`setValue`, but the migrate callback
        // sees the pre-widen TValue. Fix belongs in a `TValue = Widen<TFallback>`
        // derivation — out of scope for this PR (would ripple through 8
        // overloads). For now, accept the narrow view here.
        expectTypeOf(v).toEqualTypeOf<0>();
        // `target` narrows to the literal `5` — the migration-complete callback
        // knows the exact target version at compile-time.
        expectTypeOf(target).toEqualTypeOf<5>();
      },
    });
    // The item exists — the assertion above already ran during typecheck.
    expectTypeOf(item.version).toEqualTypeOf<5>();
  });
});

describe('interplay — narrowing survives through the whole shape', () => {
  it('both fallback and version narrow together', () => {
    const item = storage.defineItem('sync:profile', {
      schema: z.object({ name: z.string() }),
      fallback: { name: 'Anonymous' },
      version: 2,
      migrations: [(v: unknown) => ({ name: String(v) })],
    });
    expectTypeOf(item.version).toEqualTypeOf<2>();
    expectTypeOf(item.fallback).toMatchTypeOf<{ name: string }>();
    // .setValue accepts the wide schema-output shape.
    expectTypeOf(item.setValue).parameter(0).toEqualTypeOf<{ name: string }>();
  });

  it('defineSchema-wrapped validators participate the same way', () => {
    const Count = defineSchema<number>((v) => {
      if (typeof v !== 'number') throw new Error();
      return v;
    });
    const item = storage.defineItem('session:count', {
      schema: Count,
      fallback: 0,
      version: 1,
    });
    expectTypeOf(item.version).toEqualTypeOf<1>();
    expectTypeOf(item.fallback).toEqualTypeOf<0>();
    expectTypeOf(item.setValue).parameter(0).toEqualTypeOf<number>();
  });
});
