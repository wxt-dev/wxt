/**
 * Pure type primitives, template-literal parsers, and option shapes for the
 * storage package. Everything here is `import type`-safe: no runtime values.
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Browser } from '@wxt-dev/browser';

// ─── Type-level arithmetic helpers ────────────────────────────────────
//
// These support length-locked `migrations` tuples driven by the literal
// `version` number. Idioms adapted from type-challenges #7561 (Subtract)
// and Microsoft/TypeScript issue #26223 (TupleOf) — both are tail-recursive
// (TS 4.5+ raises depth limit to ~1000, so realistic version numbers are
// nowhere near the ceiling).

/**
 * Build a mutable tuple of length `L` filled with `unknown`. Used as an
 * accumulator for `Subtract` and `MigrationTuple`. Tail-recursive shape.
 */
type BuildTuple<
  L extends number,
  T extends unknown[] = [],
> = T['length'] extends L ? T : BuildTuple<L, [unknown, ...T]>;

/**
 * Type-level `M - S` via tuple pattern matching. Returns `never` when `M < S`.
 * When either operand is the bare `number` type (not a literal), the whole
 * thing widens to `number` — a graceful escape hatch.
 */
export type Subtract<M extends number, S extends number> = number extends M | S
  ? number
  : BuildTuple<M> extends [...BuildTuple<S>, ...infer R]
    ? R['length']
    : never;

/**
 * A single migration function shape. `any` in the parameter position is
 * intentional (heterogeneous chain — each position sees a different input type,
 * and function parameters are contravariant).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MigrationFn = (oldValue: any) => unknown | Promise<unknown>;

/**
 * Length-locked migrations tuple, derived from the literal `version`.
 *
 * - `version: 1` → `readonly []`
 * - `version: 3` → `readonly [MigrationFn, MigrationFn]`
 * - `version: number` → `ReadonlyArray<MigrationFn>` (no length check)
 *
 * Element type is uniform `MigrationFn`; chain-type enforcement remains the job
 * of the `defineMigrations<T>()` helper (which produces per-slot typed fns
 * whose signatures are still assignable to `MigrationFn`).
 */
export type MigrationTuple<V extends number> = number extends V
  ? ReadonlyArray<MigrationFn>
  : V extends 0 | 1
    ? readonly []
    : BuildTuple<Subtract<V, 1>> extends infer T extends unknown[]
      ? { readonly [K in keyof T]: MigrationFn }
      : never;

/**
 * Widen primitive literal types back to their base. Used in `defineItem`
 * non-schema overloads so `TValue` stays wide while `TFallback` stays narrow.
 * defineItem('x', { fallback: 5 }) → TFallback=5, TValue=number Objects/arrays
 * pass through unchanged.
 */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T;

/**
 * Deep-readonly transform. Applied at library boundaries where narrow readonly
 * literals produced by `<const>` inference must flow into contexts that would
 * otherwise reject them on mutability grounds. `T` is assignable to
 * `DeepReadonly<T>`, so declaring a parameter as `DeepReadonly<T>` accepts both
 * narrow-readonly literals and full-mutable values with no cast.
 *
 * Scope: primitives, arrays, tuples, and object literals — the shapes that
 * appear in storage payloads. Maps/Sets/callables not handled (not JSON).
 */
export type DeepReadonly<T> = T extends
  | null
  | undefined
  | boolean
  | number
  | string
  | bigint
  | symbol
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/**
 * Strip `readonly` from every top-level property. The inverse of TypeScript's
 * built-in `Readonly<T>`. See TS issue #24509 for the long-standing request to
 * add this to `lib.d.ts`.
 */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Deep counterpart of `Mutable<T>` — recursively strip `readonly` from objects,
 * arrays, and tuples. Used at return positions where a narrow deep-readonly
 * `TValue` (from `<const>` inference) needs to be widened back to its mutable
 * shape so consumers can assign to mutable targets.
 *
 * Modelled on `type-fest`'s `WritableDeep`, trimmed to storage-relevant shapes
 * (primitives / arrays / tuples / plain objects). See TS issue #13923 for the
 * general request.
 */
export type WritableDeep<T> = T extends
  | null
  | undefined
  | boolean
  | number
  | string
  | bigint
  | symbol
  ? T
  : T extends readonly [infer Head, ...infer Tail]
    ? [WritableDeep<Head>, ...WritableDeep<Tail>]
    : T extends readonly (infer U)[]
      ? WritableDeep<U>[]
      : T extends object
        ? { -readonly [K in keyof T]: WritableDeep<T[K]> }
        : T;

/**
 * Force TypeScript to eagerly resolve every member of a mapped type on hover.
 * Display-only transform — does not change assignability. Without it, hovering
 * `bookmarks.version` shows the declared `readonly version: TVersion`; with it,
 * the instantiated `3` literal.
 *
 * Also known as `Prettify` / `Simplify` / `Compute` in the ecosystem.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// ─── Storage keys ─────────────────────────────────────────────────────

/** The four `chrome.storage.*` areas supported by the WebExtensions API. */
export type StorageArea = 'local' | 'session' | 'sync' | 'managed';

/**
 * The canonical form of a storage key: `<area>:<name>`. When a literal like
 * `'local:theme'` reaches the type system, TypeScript preserves it as the
 * literal; when the type is used bare it degrades to the union of all four
 * area-prefixed template literals.
 *
 * `G` is an optional escape-hatch parameter — supply it when you want to pin
 * the name half to a specific literal or union (`StorageItemKey<'theme'>` =
 * `${StorageArea}:theme`). Most callers leave it defaulted to `string` and let
 * per-method `<const K extends StorageItemKey>` do the literal narrowing.
 */
export type StorageItemKey = `${StorageArea}:${string}`;

/**
 * Template-literal type for a metadata key. Applying `getMetaKey` to a string
 * literal `K` produces `${K}$` at the type level, so downstream callers can see
 * the exact meta key when the input is known.
 *
 * @example
 *   type Meta = MetaKey<'theme'>; // 'theme$'
 */
export type MetaKey<K extends string> = `${K}$`;

// ─── Watch / change events ────────────────────────────────────────────

/** Callback called when a value in storage is changed. */
export type WatchCallback<T> = (newValue: T, oldValue: T) => void;

/** Call to remove a watch listener. */
export type Unwatch = () => void;

/**
 * The raw change payload emitted by `browser.storage.<area>.onChanged`. Keys
 * are storage item names (without the `<area>:` prefix); values carry the
 * `newValue` / `oldValue` pair the driver observed.
 */
export type StorageAreaChanges = {
  readonly [key: string]: Browser.storage.StorageChange;
};

// ─── Serializer / validation ──────────────────────────────────────────

/**
 * Two-way converter between the runtime value type and the wire form stored in
 * `chrome.storage`. Naming (`read` / `write`) is verbatim from VueUse's
 * `useStorage` serializer.
 *
 * - `write` is required — it produces the value handed to `chrome.storage.*.set`.
 * - `read` is optional — if omitted, the raw value is passed straight to
 *   `schema.validate()`. This lets coerce schemas (e.g. `z.coerce.date()`)
 *   handle deserialization on their own.
 */
export interface WxtStorageItemSerializer<TValue, TRaw = unknown> {
  /** Convert `TValue` to the wire form written to storage. */
  write: (value: TValue) => TRaw;
  /**
   * Convert the wire form read from storage back to `TValue`.
   *
   * Declared as a **method** (shorthand syntax) so users may narrow the
   * parameter without a cast: `read(raw: MyWireType): TValue { ... }`. Method
   * params are checked bivariantly. Pipeline passes `unknown` from
   * `chrome.storage`; the impl must narrow (schema or type guard). Matches the
   * io-ts `Type<A, O, I>` pattern (decode input = `I = unknown`).
   */
  read?(raw: unknown): TValue;
}

/**
 * Recovery strategies applied when `schema` validation fails on read. Writes
 * always throw regardless of this setting.
 *
 * The callback form receives the schema issues and the raw pre-validation
 * value; its return value is used as the read result. `NoInfer` prevents the
 * callback's return type from widening the item's `TValue`.
 */
export type OnValidationError<TValue> =
  | 'throw'
  | 'fallback'
  | 'reset'
  | ((
      issues: readonly StandardSchemaV1.Issue[],
      raw: unknown,
    ) => NoInfer<TValue>);

// ─── Options ──────────────────────────────────────────────────────────

export interface GetItemOptions<T> {
  /**
   * @deprecated Renamed to `fallback`, use it instead.
   *
   *   Accepts either the mutable `T` or a deep-readonly variant — useful when
   *   copying a `defineItem`-captured narrow-readonly fallback in directly.
   */
  defaultValue?: DeepReadonly<T> | undefined;

  /**
   * Default value returned when `getItem` would otherwise return `null`.
   *
   * Accepts either the mutable `T` or a deep-readonly variant — useful when
   * copying a `defineItem`-captured narrow-readonly fallback in directly.
   */
  fallback?: DeepReadonly<T> | undefined;
}

export interface RemoveItemOptions {
  /**
   * Optionally remove metadata when deleting a key.
   *
   * @default false
   */
  removeMeta?: boolean;
}

export interface SnapshotOptions {
  /**
   * Exclude a list of keys. The storage area prefix should be removed since the
   * snapshot is for a specific storage area already.
   */
  excludeKeys?: readonly string[];
}

export interface WxtStorageItemOptions<
  T,
  TRaw = unknown,
  TVersion extends number = number,
> {
  /**
   * @deprecated Renamed to `fallback`, use it instead.
   *
   *   Accepts a deep-readonly variant so narrow readonly literals produced by
   *   `<const>` inference (e.g. `{ label: 'Default' as const }`) flow through
   *   without a cast at the call site.
   */
  defaultValue?: DeepReadonly<T> | undefined;

  /**
   * Default value returned when `getValue` would otherwise return `null`.
   *
   * Accepts a deep-readonly variant — see `defaultValue` comment above.
   */
  fallback?: DeepReadonly<T> | undefined;

  /**
   * If passed, a value in storage will be initialized immediately after
   * defining the storage item. This function returns the value that will be
   * saved to storage during the initialization process if a value doesn't
   * already exist.
   */
  init?: () => T | Promise<T>;

  /**
   * Provide a version number for the storage item to enable migrations. When
   * changing the version in the future, migration functions will be ran on
   * application startup.
   *
   * When passed as a numeric literal (`version: 3`) TypeScript captures it as
   * the literal type `3` via the `<const TVersion extends number>` modifier on
   * `defineItem`, which:
   *
   * 1. Length-locks the `migrations` tuple below to exactly `TVersion - 1`
   *    entries. Mismatched counts become compile-time errors.
   * 2. Narrows `WxtStorageItem['version']` to the literal for typed introspection.
   */
  version?: TVersion;

  /**
   * Chain of migration functions applied to previously-stored values on read.
   * Ordered by target version: position `i` migrates from version `i + 1` to `i
   * + 2`. `migrations: [v1to2, v2to3]` paired with `version: 3` means v1
   * storage runs both, v2 storage runs only the second, v3 runs nothing.
   *
   * Use `defineMigrations<TValue>()` for chain-checked typing where each
   * migration's return type is verified against the next fn's parameter and the
   * final return is verified against `TValue`.
   *
   * Note: the parameter type is `any`, not `unknown`. Intentional — each
   * position accepts a different type (v1 raw at position 0, then previous fn's
   * return type). `unknown` in a contravariant position would reject
   * narrow-param fns produced by `defineMigrations`.
   */
  migrations?: MigrationTuple<TVersion>;

  /**
   * Print debug logs, such as migration process.
   *
   * @default false
   */
  debug?: boolean;

  /** A callback function that runs on migration complete. */
  onMigrationComplete?: (migratedValue: T, targetVersion: TVersion) => void;

  /**
   * A [Standard Schema](https://standardschema.dev/) validator applied to the
   * deserialized runtime value on read, and to the input value on write.
   *
   * Pipeline:
   *
   * - Read: `raw → migrate → serializer.read? → schema.validate → T`
   * - Write: `T → schema.validate → serializer.write? → raw`
   *
   * Any Standard Schema-conformant validator works: Zod, Valibot, ArkType,
   * Effect Schema. For TypeBox, io-ts, or custom parsers, wrap them with
   * `defineSchema()`.
   *
   * @example
   *   ```ts
   *   import { z } from 'zod';
   *   const theme = storage.defineItem('local:theme', {
   *     schema: z.enum(['light', 'dark', 'system']),
   *   });
   *   ```;
   */
  schema?: StandardSchemaV1<unknown, T>;

  /**
   * Convert between the runtime type `T` and the wire form stored in
   * `chrome.storage`. `write` is required; `read` is optional — omit when a
   * coerce schema handles deserialization (e.g. `z.coerce.date()`).
   *
   * Naming mirrors VueUse's `useStorage` serializer.
   *
   * @example
   *   ```ts
   *   // Sets aren't JSON-serializable — hand-write both directions.
   *   storage.defineItem('local:enabled-sites', {
   *   serializer: {
   *   write: (set: Set<string>) => [...set],
   *   read: (raw) => new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []),
   *   },
   *   });
   *
   *   // Storing a Date with a coerce schema: only `write` needed.
   *   storage.defineItem('local:install-date', {
   *   serializer: { write: (d: Date) => d.toISOString() },
   *   schema: z.coerce.date(),
   *   });
   *   ```
   */
  serializer?: WxtStorageItemSerializer<T, TRaw>;

  /**
   * How to handle a `schema` failure when reading a value from storage. Writes
   * always throw on schema failure; this option only affects reads and
   * `watch()` callbacks.
   *
   * - `'throw'` (default): throw a `SchemaError` containing the issues.
   * - `'fallback'`: return `fallback` (or `null` if no fallback is set).
   * - `'reset'`: clear the invalid value from storage and return `fallback`.
   * - `(issues, raw) => T`: custom recovery — the returned value becomes the read
   *   result. The value is **not** written back to storage.
   *
   * @default 'throw'
   */
  onValidationError?: OnValidationError<T>;
}

// ─── Internal utilities ───────────────────────────────────────────────

/**
 * Same as `Partial`, but includes `| null`. Makes every property of `T`
 * optional and nullable — used by `snapshot` restore paths where a subset of
 * keys may have been unset since the snapshot was taken.
 */
export type NullablePartial<T> = {
  [key in keyof T]+?: T[key] | undefined | null;
};

// ─── Batch API mapped tuples ─────────────────────────────────────────

/**
 * Forward declaration — the real `WxtStorageItem` interface lives in
 * `./index.ts` and carries method signatures that reference the runtime driver.
 * This local structural alias captures only what the batch mapped tuples need
 * (TValue and TKey) so `./types.ts` stays impl-free.
 *
 * @internal
 */
export type WxtStorageItemLike<
  TValue = unknown,
  TKey extends StorageItemKey = StorageItemKey,
> = {
  readonly key: TKey;
  readonly getValue: (...args: readonly unknown[]) => Promise<TValue>;
  readonly fallback: TValue | null;
  /**
   * Apply the item's read pipeline (schema.validate + serializer.read +
   * onValidationError) to a pre-fetched raw value. Used by batch APIs
   * (`getItems`) so a single driver round-trip can still route each item
   * through its typed pipeline.
   *
   * @internal
   */
  readonly _processRead?: (raw: unknown) => Promise<TValue>;
};

/** Element shapes accepted by `WxtStorage.getItems`. */
export type GetItemsInputElement =
  | StorageItemKey
  | WxtStorageItemLike
  | {
      readonly key: StorageItemKey;
      readonly options?: GetItemOptions<unknown>;
    };

/**
 * Mapped-tuple return type for `getItems`. Each input element resolves to a `{
 * key; value }` pair with the narrowest key + value the input permits:
 *
 * - `WxtStorageItem<V, _, K>` → `{ key: K; value: V }` (fully typed).
 * - `{ key: K; options: { fallback: V } }` → `{ key: K; value: V | null }`.
 * - Bare literal key `'local:x'` → `{ key: 'local:x'; value: unknown }`.
 * - Wider `StorageItemKey` union → `{ key: StorageItemKey; value: unknown }`.
 */
export type GetItemsResult<T extends ReadonlyArray<GetItemsInputElement>> = {
  readonly [I in keyof T]: T[I] extends WxtStorageItemLike<infer V, infer K>
    ? { readonly key: K; readonly value: V }
    : T[I] extends {
          readonly key: infer K extends StorageItemKey;
          readonly options?: GetItemOptions<infer V>;
        }
      ? { readonly key: K; readonly value: V | null }
      : T[I] extends StorageItemKey
        ? { readonly key: T[I]; readonly value: unknown }
        : { readonly key: StorageItemKey; readonly value: unknown };
};

/** Element shapes accepted by `WxtStorage.getMetas`. */
export type GetMetasInputElement = StorageItemKey | WxtStorageItemLike;

/**
 * Mapped-tuple return type for `getMetas`. Preserves each input's literal key
 * type; metadata is always `Record<string, unknown>` because the storage layer
 * doesn't type it.
 */
export type GetMetasResult<T extends ReadonlyArray<GetMetasInputElement>> = {
  readonly [I in keyof T]: T[I] extends WxtStorageItemLike<unknown, infer K>
    ? { readonly key: K; readonly meta: Record<string, unknown> }
    : T[I] extends StorageItemKey
      ? { readonly key: T[I]; readonly meta: Record<string, unknown> }
      : {
          readonly key: StorageItemKey;
          readonly meta: Record<string, unknown>;
        };
};
