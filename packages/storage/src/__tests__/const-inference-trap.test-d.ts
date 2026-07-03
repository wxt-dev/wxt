/**
 * Const inference in defineItem — full-inference vs partial-explicit repro. Run
 * under `vitest --typecheck` (or `tsc --noEmit`).
 */
import { describe, it, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { storage } from '../index';

const Schema = z.object({ label: z.string() });
type S = z.infer<typeof Schema>;

describe('full inference — const modifier fires for every literal', () => {
  it('captures fallback + version + key as literals', () => {
    const item = storage.defineItem('sync:x', {
      schema: Schema,
      fallback: { label: 'Default' },
      version: 3,
      migrations: [(v: unknown): S => ({ label: String(v) }), (v: S): S => v],
    });
    expectTypeOf(item.key).toEqualTypeOf<'sync:x'>();
    expectTypeOf(item.version).toEqualTypeOf<3>();
    expectTypeOf(item.fallback).toEqualTypeOf<{ readonly label: 'Default' }>();
    // TValue stays wide — .setValue accepts any conforming shape.
    expectTypeOf(item.setValue).parameter(0).toEqualTypeOf<S>();
  });

  it('narrows primitives too', () => {
    const item = storage.defineItem('local:count', {
      fallback: 5,
      version: 2,
      migrations: [(v: unknown): number => Number(v)],
    });
    expectTypeOf(item.fallback).toEqualTypeOf<5>();
    expectTypeOf(item.version).toEqualTypeOf<2>();
    expectTypeOf(item.setValue).parameter(0).toEqualTypeOf<number>();
  });
});

describe('the explicit-generics trap', () => {
  // KEEP THIS DOCUMENTED. If a user supplies ANY explicit type argument to
  // defineItem, the `<const>` modifier on later type parameters no longer
  // fires — TS uses their defaults instead of running inference. The user's
  // fallback and version widen back to the schema's output type and `number`.
  //
  // Workaround: DO NOT pass explicit generics. Rely on full inference. If
  // TMetadata typing is needed, add it as the first-and-only explicit generic
  // via a wrapping const or via `storage.defineItem<never, MyMeta>('key', ...)`
  // — but that also disables narrowing on TFallback/TVersion.
  it('widens fallback + version when ANY explicit generic is passed', () => {
    const item = storage.defineItem<typeof Schema>('sync:x', {
      schema: Schema,
      fallback: { label: 'Default' },
      version: 3,
      migrations: [(v: unknown): S => ({ label: String(v) }), (v: S): S => v],
    });
    // fallback widens to the schema output — literal is lost.
    expectTypeOf(item.fallback).toEqualTypeOf<S>();
    // version widens to `number`.
    expectTypeOf(item.version).toEqualTypeOf<number>();
  });
});
