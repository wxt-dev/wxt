/**
 * Pure type primitives, template-literal parsers, and option shapes for the
 * storage package.
 *
 * Everything here is `import type`-safe: no runtime values, no dependencies on
 * the driver or the `WxtStorage` interface. Kept out of `index.ts` so later
 * work has a canonical location to add typed utilities (`MetaKey`, future
 * `Split`/`Join`/`Replace` helpers).
 *
 * Anything referring to a runtime interface (methods on `WxtStorage`,
 * `WxtStorageItem`, `WxtStorageDriver`) stays in `index.ts` and is composed
 * with the primitives from this file.
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
 * otherwise reject them on mutability grounds (e.g. a caller copies
 * `bookmarks.fallback` — typed as `{ readonly label: 'Default'; readonly urls:
 * readonly [] }` — into `storage.getItem(key, { fallback })`).
 *
 * `T` is assignable to `DeepReadonly<T>` (mutable→readonly widening is always
 * allowed), so declaring a parameter as `DeepReadonly<T>` accepts BOTH
 * narrow-readonly literals AND full-mutable values — zero cast at the call
 * site.
 *
 * Scope: covers primitives, arrays, tuples, and object literals — the shapes
 * that actually appear in storage payloads. Maps, Sets, and callables are not
 * handled (they cannot be JSON-serialised into storage anyway).
 *
 * @see type-fest `WritableDeep` for the canonical inverse
 * @see TypeScript issue #13923 (`DeepReadonly`/`DeepWritable` built-in request)
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
 * Force TypeScript to eagerly resolve every member of a mapped type on hover,
 * instead of displaying unresolved type-parameter references. This is a
 * display-only transform — it does not change assignability or the resolved
 * type. Without it, hovering `bookmarks.version` in an editor shows the
 * interface's declared member (`readonly version: TVersion`); with it, hovering
 * shows the instantiated `3` literal.
 *
 * The `& {}` intersection tail prevents TypeScript from short-circuiting the
 * mapped type back to `T` on structurally identical shapes — which would defeat
 * the eager-evaluation purpose.
 *
 * Pattern is often called `Prettify`, `Simplify`, or `Compute` in the TS
 * ecosystem (see type-fest `Simplify`, Matt Pocock's `Prettify`, and the
 * long-running TS issue #47980 for a native compiler hint).
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
   * parameter to a specific type without a cast:
   *
   * Read(raw: MyWireType): TValue { ... } // ✓ no cast needed
   *
   * Method parameters are checked bivariantly under `strictFunctionTypes`,
   * meaning a narrower parameter type is still assignable. The trust boundary
   * is enforced by the caller (the pipeline passes `unknown` from
   * `chrome.storage`); the method implementation must narrow `raw` itself using
   * a schema or type guard. This is identical to the io-ts `Type<A, O, I>`
   * pattern (decode input is always `I = unknown` at the boundary, but the
   * implementation may assume a specific shape).
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
   * The tuple is **ordered by target version**: position `i` (0-indexed)
   * migrates from version `i + 1` to version `i + 2`. So
   *
   * `migrations: [migrateV1toV2, migrateV2toV3]`
   *
   * Paired with `version: 3` means: v1 storage runs both functions, v2 storage
   * runs only the second, v3 storage runs nothing.
   *
   * At the type level, TS accepts any tuple of `(oldValue: unknown) =>
   * unknown`. For chain-checked typing where each migration's return type
   * matches the next migration's parameter type (and the last matches
   * `TValue`), use the `defineMigrations<TValue>()` helper.
   *
   * ### Alternative designs considered (post-PR aklinker discussion may
   *
   * Pick a different one):
   *
   * - **A. Tuple, positional (this design).** Fully chained via
   *   `defineMigrations`. Breaking: users on `Record<number, fn>` object form
   *   must convert to a positional tuple. No support for non-contiguous version
   *   numbers.
   * - **B. `defineMigrations<TValue>({ 2: fn, 3: fn })` builder with per- version
   *   types.** Keeps arbitrary numeric keys, requires the user to thread
   *   intermediate types by hand.
   * - **C. `Record<number, (oldValue: unknown) => unknown>`.** Kills the old
   *   `any` but leaves the chain unchecked.
   * - **D. Keep the current `Record<number, (any) => any>`.** Zero-risk, no
   *   honesty win.
   *
   * NOTE ON THE OPTION TYPE: the array element type is `(oldValue: any) =>
   * unknown | Promise<unknown>` rather than `(oldValue: unknown) => unknown`.
   * `any` in the parameter position is intentional and honest for a
   * heterogeneous chain: each position's fn accepts a different input type
   * (position 0 accepts the raw stored value; positions 1..N-1 accept the
   * previous fn's return type). A single- `(oldValue: unknown)` type would
   * reject narrow-param fns produced by `defineMigrations` because parameters
   * are contravariant.
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
   * `chrome.storage`. `write` is required when `serializer` is present; `read`
   * is optional — omit it when `schema` handles deserialization via coercion
   * (e.g. `z.coerce.date()`).
   *
   * Naming mirrors VueUse's `useStorage` serializer.
   *
   * ## Type inference
   *
   * `TRaw` (the wire form) is inferred from `write`'s return type when TS is
   * able to run full inference on `defineItem`. That happens when either:
   *
   * - `write`'s parameter is annotated, e.g. `write: (set: Set<string>) =>
   *   [...set]`, OR
   * - `fallback` / `defaultValue` is typed and drives `TValue`.
   *
   * TypeScript cannot infer `TRaw` when the caller supplies an explicit
   * `defineItem<TValue>(...)` generic — `TRaw`'s default of `unknown` is
   * committed before TS looks at `write`'s return type. In that case `raw`
   * inside `read` is `unknown` and the caller must narrow it.
   *
   * @example
   *   ```ts
   *   // Sets aren't JSON-serialisable — hand-write both directions.
   *   // `write`'s annotated param makes both TValue and TRaw flow.
   *   storage.defineItem('local:enabled-sites', {
   *   serializer: {
   *   write: (set: Set<string>) => [...set],
   *   read: (raw) => new Set(raw),  // raw: string[] — no cast needed
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
  /** Marker discriminant — a plain `{ key }` bag doesn't have `getValue`. */
  readonly getValue: (...args: readonly unknown[]) => Promise<TValue>;
  /** Fallback threaded into `getItems` batch reads for this item. */
  readonly fallback: TValue | null;
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
