/**
 * Const-inference tests for `debug` and `schema` accessors — the accessors that
 * fully narrow to their literal input under `<const>` inference.
 *
 * `onValidationError` intentionally exposes as the wide `OnValidationError<T>`
 * union rather than a captured literal. Threading a `<const>`-narrowed policy
 * through all 8 defineItem overloads (+ mirroring for a future meta schema PR)
 * was determined to outweigh the marginal DX benefit — users typically check
 * the policy at runtime or don't inspect it at all. See
 * `WxtStorageItem.onValidationError` for the rationale.
 *
 * Run under `vitest --typecheck` (or `tsc --noEmit`).
 */
import { describe, it, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { storage } from '../index';

describe('debug: captured as boolean literal', () => {
  it('narrows to `true` when explicitly enabled', () => {
    const item = storage.defineItem('local:x', { fallback: 0, debug: true });
    expectTypeOf(item.debug).toEqualTypeOf<true>();
  });

  it('narrows to `false` when explicitly disabled', () => {
    const item = storage.defineItem('local:x', { fallback: 0, debug: false });
    expectTypeOf(item.debug).toEqualTypeOf<false>();
  });

  it('defaults to `false` when omitted', () => {
    const item = storage.defineItem('local:x', { fallback: 0 });
    expectTypeOf(item.debug).toEqualTypeOf<false>();
  });
});

describe('schema: captured as the exact schema type', () => {
  it('exposes the Zod schema type when provided', () => {
    const NumberSchema = z.number();
    const item = storage.defineItem('local:x', {
      schema: NumberSchema,
      fallback: 0,
    });
    expectTypeOf(item.schema).toEqualTypeOf<typeof NumberSchema>();
  });

  it('is undefined when no schema is provided', () => {
    const item = storage.defineItem('local:x', { fallback: 0 });
    expectTypeOf(item.schema).toEqualTypeOf<undefined>();
  });
});

describe('every literal accessor narrows in one call', () => {
  it('captures key + fallback + version + debug + schema all at once', () => {
    const ThemeSchema = z.enum(['light', 'dark', 'system']);
    const item = storage.defineItem('sync:theme', {
      schema: ThemeSchema,
      fallback: 'system',
      version: 2,
      migrations: [(v: unknown): 'light' | 'dark' | 'system' => v as never],
      debug: true,
    });

    expectTypeOf(item.key).toEqualTypeOf<'sync:theme'>();
    expectTypeOf(item.fallback).toEqualTypeOf<'system'>();
    expectTypeOf(item.version).toEqualTypeOf<2>();
    expectTypeOf(item.debug).toEqualTypeOf<true>();
    expectTypeOf(item.schema).toEqualTypeOf<typeof ThemeSchema>();
    // TValue stays WIDE — .setValue accepts any Theme
    expectTypeOf(item.setValue)
      .parameter(0)
      .toEqualTypeOf<'light' | 'dark' | 'system'>();
  });
});
