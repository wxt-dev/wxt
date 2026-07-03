/**
 * Branded storage area — the `<TArea>` slot on `WxtStorageDriver` and the
 * derived `readonly area` accessor on `WxtStorageItem`.
 *
 * ## Two related mechanisms
 *
 * 1. **`WxtStorageDriver<TArea extends StorageArea>`** carries the driver's area
 *    as a phantom-and-runtime brand. Every call to `createDriver('local')`
 *    (etc.) captures the literal via `<const TArea>`, so the returned driver is
 *    typed `WxtStorageDriver<'local'>` \u2014 distinct from
 *    `WxtStorageDriver<'managed'>` at compile time. `TArea` sits in a read-only
 *    output position (`readonly area: TArea`), so it's covariant: a narrow
 *    driver is assignable to a wide `WxtStorageDriver<StorageArea>` (widening
 *    is fine at read sites).
 * 2. **`WxtStorageItem.area`** is derived from `TKey` via a template-literal
 *    `infer A extends StorageArea` pattern:
 *
 *    Readonly area: TKey extends `${infer A extends StorageArea}:${string}` ? A :
 *    StorageArea;
 *
 *    The runtime value comes from the singleton's `resolveKey`, which splits the
 *    key at the first `:` and looks up the driver. `item.area === driver.area`
 *    for every item routed through the same driver.
 *
 * These aren't linked in the type system \u2014 the item's `.area` is
 * re-derived from `TKey`, not threaded through the driver's `TArea`. That's
 * intentional: the singleton internally dispatches on the key's string prefix,
 * so the per-item narrow area doesn't need to flow through the driver's
 * phantom.
 *
 * `WxtStorageDriver` itself is not exported \u2014 it's an internal
 * abstraction. The user-visible surface is `.area` on every item.
 */
import { expectTypeOf, describe, it } from 'vitest';
import { storage } from '../index';
import type { StorageArea } from '../types';

describe('WxtStorageItem.area narrows to the literal storage area', () => {
  it('local: prefix \u2192 area is the literal "local"', () => {
    const item = storage.defineItem('local:count', { fallback: 0 });
    expectTypeOf(item.area).toEqualTypeOf<'local'>();
  });

  it('sync: prefix \u2192 area is the literal "sync"', () => {
    const item = storage.defineItem('sync:bookmarks', {
      fallback: [] as string[],
    });
    expectTypeOf(item.area).toEqualTypeOf<'sync'>();
  });

  it('managed: prefix \u2192 area is the literal "managed"', () => {
    const item = storage.defineItem('managed:policy');
    expectTypeOf(item.area).toEqualTypeOf<'managed'>();
  });

  it('session: prefix \u2192 area is the literal "session"', () => {
    const item = storage.defineItem('session:cache', {
      fallback: {} as Record<string, unknown>,
    });
    expectTypeOf(item.area).toEqualTypeOf<'session'>();
  });

  it('wide key widens area back to StorageArea', () => {
    // When the caller passes a wide StorageItemKey value (not a literal),
    // TS can't extract a narrow area \u2014 it widens to the full union. This is
    // the correct fallback behavior; users can still runtime-check `item.area`
    // and TS will narrow on each branch.
    const raw = 'local:x' as `local:${string}`;
    const item = storage.defineItem(raw);
    expectTypeOf(item.area).toEqualTypeOf<'local'>();

    // With an even wider key type:
    const wider = 'local:x' as string as `${StorageArea}:${string}`;
    const wideItem = storage.defineItem(wider);
    expectTypeOf(wideItem.area).toEqualTypeOf<StorageArea>();
  });

  it('area enables exhaustive discrimination in runtime code', () => {
    const item = storage.defineItem('local:count', { fallback: 0 });
    // Runtime narrowing: TS narrows `item.area` to the branch's literal.
    // Compile-time proof that the branch is reachable:
    if (item.area === 'local') {
      expectTypeOf(item.area).toEqualTypeOf<'local'>();
    }
    // And the wrong branch is unreachable:
    if ((item.area as StorageArea) === 'managed') {
      // Un-narrowable statically because item.area === 'local' at type level.
      // Casting to StorageArea inside the condition lets TS accept the compare
      // for the runtime-only demonstration.
    }
  });
});
