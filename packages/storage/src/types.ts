/**
 * Pure type primitives, template-literal parsers, and option shapes for the
 * storage package.
 *
 * Everything here is `import type`-safe: no runtime values, no dependencies on
 * the driver or the `WxtStorage` interface. Kept out of `index.ts` so later
 * work has a canonical location to add typed utilities (`KeyParts`, `MetaKey`,
 * future `Split`/`Join`/`Replace` helpers).
 *
 * Anything referring to a runtime interface (methods on `WxtStorage`,
 * `WxtStorageItem`, `WxtStorageDriver`) stays in `index.ts` and is composed
 * with the primitives from this file.
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Browser } from '@wxt-dev/browser';

// ─── Storage keys ─────────────────────────────────────────────────────

/** The four `chrome.storage.*` areas supported by the WebExtensions API. */
export type StorageArea = 'local' | 'session' | 'sync' | 'managed';

/**
 * The canonical form of a storage key: `<area>:<name>`. When a literal like
 * `'local:theme'` reaches the type system, TypeScript preserves it as the
 * literal; when the type is used bare it degrades to the union of all four
 * area-prefixed template literals.
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

/**
 * Template-literal parse of a `StorageItemKey` into its area + name halves.
 * Used internally by `resolveKey`; kept as a pure type here so it can be
 * composed elsewhere (batch APIs, migrations chains) without dragging the
 * `WxtStorageDriver` runtime dependency along.
 *
 * @example
 *   type P = KeyParts<'local:theme'>;
 *   // { readonly driverArea: 'local'; readonly driverKey: 'theme' }
 */
export type KeyParts<K extends StorageItemKey> =
  K extends `${infer A extends StorageArea}:${infer Rest}`
    ? { readonly driverArea: A; readonly driverKey: Rest }
    : never;

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
  /** Convert the wire form read from storage back to `TValue`. */
  read?: (raw: TRaw) => TValue;
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
  /** @deprecated Renamed to `fallback`, use it instead. */
  defaultValue?: T | undefined;

  /** Default value returned when `getItem` would otherwise return `null`. */
  fallback?: T | undefined;
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

export interface WxtStorageItemOptions<T, TRaw = unknown> {
  /** @deprecated Renamed to `fallback`, use it instead. */
  defaultValue?: T | undefined;

  /** Default value returned when `getValue` would otherwise return `null`. */
  fallback?: T | undefined;

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
   */
  version?: number;

  /**
   * A map of version numbers to the functions used to migrate the data to that
   * version.
   */
  migrations?: Record<number, (oldValue: any) => any>;

  /**
   * Print debug logs, such as migration process.
   *
   * @default false
   */
  debug?: boolean;

  /** A callback function that runs on migration complete. */
  onMigrationComplete?: (migratedValue: T, targetVersion: number) => void;

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
  readonly [I in keyof T]: T[I] extends WxtStorageItemLike<any, infer K>
    ? { readonly key: K; readonly meta: Record<string, unknown> }
    : T[I] extends StorageItemKey
      ? { readonly key: T[I]; readonly meta: Record<string, unknown> }
      : {
          readonly key: StorageItemKey;
          readonly meta: Record<string, unknown>;
        };
};
