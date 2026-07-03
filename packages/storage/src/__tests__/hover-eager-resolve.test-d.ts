/**
 * Hover / eager-type-resolution tests.
 *
 * `WxtStorageItem` is a big generic interface. Without any special treatment
 * TypeScript displays each field on hover as its DECLARED form, referencing the
 * type parameter (`readonly version: TVersion`, `readonly debug: TDebug`), not
 * the instantiated value. The type CHECKER always sees the resolved literal
 * (`3`, `true`) — the assignability behavior is correct either way — but editor
 * hover ergonomics suffer.
 *
 * `Prettify<T> = { [K in keyof T]: T[K] } & {}` forces TypeScript to eagerly
 * map each key of the item interface, resolving every type-parameter reference
 * inline. Applied at every `defineItem` overload's return position. Effect:
 * hovering on `bookmarks.version` in an editor now shows `readonly version: 3`
 * instead of `readonly version: TVersion`. Same story for `.debug`, `.key`,
 * `.fallback`, and every method's resolved return.
 *
 * These `.test-d.ts` assertions only verify the resolved TYPE — vitest's type
 * runner cannot inspect editor hover directly. But they do prove the
 * fundamental precondition: the resolved type IS the literal. If a future
 * refactor breaks that (e.g. accidentally widens `TVersion` to `number` at some
 * overload), these tests fail before shipping.
 *
 * Pattern references:
 *
 * - Type-fest: `Simplify<T>` — identical shape, older name
 * - Matt Pocock: "Prettify" — same idea, popular blog-post name
 * - TS issue #47980: long-running compiler-native hover-hint request
 */
import { expectTypeOf, describe, it } from 'vitest';
import { storage } from '../index';

describe('accessor hover eagerly resolves to literals', () => {
  const item = storage.defineItem('sync:bookmarks', {
    fallback: { label: 'Default', urls: [] as string[] },
    version: 3,
    debug: true,
  });

  it('.key hovers as the literal storage key', () => {
    expectTypeOf(item.key).toEqualTypeOf<'sync:bookmarks'>();
  });

  it('.version hovers as the literal numeric version', () => {
    expectTypeOf(item.version).toEqualTypeOf<3>();
  });

  it('.debug hovers as the literal boolean', () => {
    expectTypeOf(item.debug).toEqualTypeOf<true>();
  });

  it('.fallback hovers as the narrow readonly literal shape', () => {
    // Fallback stays narrow (`<const>` on TFallback) and readonly
    // (DeepReadonly boundary), so hover shows the exact shape rather than the
    // wider `{ label: string; urls: string[] }`.
    expectTypeOf(item.fallback).toEqualTypeOf<{
      readonly label: 'Default';
      readonly urls: string[];
    }>();
  });

  it('.schema hovers as `undefined` when no schema was passed', () => {
    expectTypeOf(item.schema).toEqualTypeOf<undefined>();
  });

  it('.getValue hovers with the resolved return type', () => {
    // Return-position `Widen<TValue>` — a scalar would collapse to its base
    // primitive here, but object fallbacks stay as their narrow-readonly
    // literal shape (Widen<T> is a top-level widener, not deep).
    expectTypeOf(item.getValue).returns.toEqualTypeOf<
      Promise<{ readonly label: 'Default'; readonly urls: string[] }>
    >();
  });
});

describe('accessor hover with a schema present', () => {
  it('.schema hovers as the exact schema type', () => {
    // Build a minimal Standard-Schema-shaped object inline so the test file
    // stays framework-neutral. Any real Zod/Valibot schema has the same shape.
    const numberSchema = {
      '~standard': {
        version: 1 as const,
        vendor: 'test',
        validate: (v: unknown) => ({ value: v as number }),
      },
      _n: 0 as number, // phantom carrier — only for the type shape
    };
    const item = storage.defineItem('local:count', {
      schema: numberSchema,
      fallback: 0,
      version: 1,
    });
    expectTypeOf(item.schema).toEqualTypeOf<typeof numberSchema>();
    expectTypeOf(item.version).toEqualTypeOf<1>();
  });
});
