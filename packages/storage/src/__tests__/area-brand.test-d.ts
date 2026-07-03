/**
 * Branded storage area — the `<TArea>` slot on `WxtStorageDriver` and the
 * derived `readonly area` accessor on `WxtStorageItem`.
 *
 * ## 1. `WxtStorageDriver<TArea>` brand
 *
 * Every `createDriver('local')` (etc.) captures the literal via `<const
 * TArea>`, so the returned driver is typed with area `'local'` — distinct from
 * `'managed'` at compile time even when method surfaces overlap. `TArea` sits
 * in an output-only `readonly area` position, so it's covariant: a narrow
 * driver is assignable to a wide `WxtStorageDriver<StorageArea>` (widening is
 * fine at read sites).
 *
 * ## 2. `WxtStorageItem.area` — derived from `TKey`
 *
 * ```ts
 * readonly area: TKey extends `${infer A extends StorageArea}:${string}`
 *   ? A
 *   : StorageArea;
 * ```
 *
 * The runtime value comes from `driver.area`, so `item.area === driver.area`
 * for every item routed through the same driver. The item's `.area` is
 * re-derived from `TKey`, not threaded through the driver's `TArea`. That's
 * intentional: the singleton dispatches on the key's string prefix at runtime.
 *
 * ## 3. Discriminated read-only / mutable split
 *
 * `WxtStorageDriver` is now a distributing conditional:
 *
 * ```ts
 * type WxtStorageDriver<T extends StorageArea = StorageArea> =
 *   T extends 'managed'
 *     ? ReadonlyStorageDriver<T>
 *     : MutableStorageDriver<T>;
 * ```
 *
 * `WxtStorageDriver<'managed'>` structurally omits `setItem`, `setItems`,
 * `removeItem`, `removeItems`, `clear`, `restoreSnapshot` — the "managed is
 * read-only" invariant lives in the type system, not just runtime docs.
 * Distribution across `T = StorageArea` yields `Readonly<'managed'> |
 * Mutable<'local' | 'sync' | 'session'>`, so internal callers with wide area
 * cannot call mutating methods without first narrowing via the internal
 * `assertMutable` guard.
 *
 * Runtime surface: `storage.setItem('managed:x', v)` (and all other writes
 * against `managed:*` keys) now throws with a WXT-branded error instead of the
 * raw browser error. See the runtime test `"rejects writes to
 * browser.storage.managed with a clear error"` in `index.test.ts`.
 *
 * `WxtStorageDriver` is not exported — internal abstraction only. The
 * user-visible surface is `.area` on every item and the runtime assertion.
 */
import { expectTypeOf, describe, it } from 'vitest';
import { storage } from '../index';
import type { StorageArea } from '../types';

describe('WxtStorageItem.area narrows to the literal storage area', () => {
  it('local: prefix → area is the literal "local"', () => {
    const item = storage.defineItem('local:count', { fallback: 0 });
    expectTypeOf(item.area).toEqualTypeOf<'local'>();
  });

  it('sync: prefix → area is the literal "sync"', () => {
    const item = storage.defineItem('sync:bookmarks', {
      fallback: [] as string[],
    });
    expectTypeOf(item.area).toEqualTypeOf<'sync'>();
  });

  it('managed: prefix → area is the literal "managed"', () => {
    const item = storage.defineItem('managed:policy');
    expectTypeOf(item.area).toEqualTypeOf<'managed'>();
  });

  it('session: prefix → area is the literal "session"', () => {
    const item = storage.defineItem('session:cache', {
      fallback: {} as Record<string, unknown>,
    });
    expectTypeOf(item.area).toEqualTypeOf<'session'>();
  });

  it('template-literal key widens area to the matching literal', () => {
    // A `local:${string}` typed key still extracts the `'local'` prefix.
    const raw = 'local:x' as `local:${string}`;
    const item = storage.defineItem(raw);
    expectTypeOf(item.area).toEqualTypeOf<'local'>();

    // A fully wide `${StorageArea}:${string}` typed key widens area to the
    // full union — TS can't pick a single prefix at compile time.
    const wider = 'local:x' as string as `${StorageArea}:${string}`;
    const wideItem = storage.defineItem(wider);
    expectTypeOf(wideItem.area).toEqualTypeOf<StorageArea>();
  });

  it('area enables exhaustive discrimination in runtime code', () => {
    const item = storage.defineItem('local:count', { fallback: 0 });
    // TS narrows `item.area` to `'local'` inside the branch.
    if (item.area === 'local') {
      expectTypeOf(item.area).toEqualTypeOf<'local'>();
    }
  });
});
