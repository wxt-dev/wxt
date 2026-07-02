/**
 * Simplified storage APIs with support for versioned fields, snapshots,
 * metadata, and item definitions.
 *
 * See [the guide](https://wxt.dev/storage.html) for more information.
 *
 * @module @wxt-dev/storage
 */
import { browser } from '@wxt-dev/browser';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { SchemaError } from '@standard-schema/utils';
import { Mutex } from 'async-mutex';
import { dequal } from 'dequal/lite';
import type {
  GetItemOptions,
  KeyParts,
  MetaKey,
  NullablePartial,
  RemoveItemOptions,
  SnapshotOptions,
  StorageArea,
  StorageAreaChanges,
  StorageItemKey,
  Unwatch,
  WatchCallback,
  WxtStorageItemOptions,
} from './types';

// Re-export public types for API compat with `@wxt-dev/storage` consumers.
export type {
  GetItemOptions,
  MetaKey,
  OnValidationError,
  RemoveItemOptions,
  SnapshotOptions,
  StorageArea,
  StorageAreaChanges,
  StorageItemKey,
  Unwatch,
  WatchCallback,
  WxtStorageItemOptions,
  WxtStorageItemSerializer,
} from './types';

export const storage = createStorage();

function createStorage(): WxtStorage {
  const drivers: Record<StorageArea, WxtStorageDriver> = {
    local: createDriver('local'),
    session: createDriver('session'),
    sync: createDriver('sync'),
    managed: createDriver('managed'),
  };

  const getDriver = (area: StorageArea) => {
    const driver = drivers[area];
    if (driver == null) {
      const areaNames = Object.keys(drivers).join(', ');
      throw Error(`Invalid area "${area}". Options: ${areaNames}`);
    }
    return driver;
  };

  const resolveKey = <const K extends StorageItemKey>(
    key: K,
  ): ResolvedKey<K> => {
    const deliminatorIndex = key.indexOf(':');
    const driverArea = key.substring(0, deliminatorIndex) as StorageArea;

    const driverKey = key.substring(deliminatorIndex + 1);
    if (driverKey == null) {
      throw Error(
        `Storage key should be in the form of "area:key", but received "${key}"`,
      );
    }

    // The runtime substring result is `string`; the compile-time template
    // literal parse in `KeyParts<K>` narrows `driverArea` and `driverKey`
    // at every call site. Trust-boundary cast: K's constraint guarantees
    // the parse succeeds. Double-cast through `unknown` because
    // `KeyParts<K>` has `readonly` fields that TS's overlap check treats
    // as non-assignable from the mutable object literal.
    return {
      driverArea,
      driverKey,
      driver: getDriver(driverArea),
    } as unknown as ResolvedKey<K>;
  };

  const getMetaKey = <const K extends string>(key: K): MetaKey<K> => `${key}$`;

  /**
   * `Object.entries` widens key types to `string`. This shim preserves the key
   * type of a `Partial<Record<K, V>>` map, letting downstream loops keep `area:
   * StorageArea` narrow without a per-call `as StorageArea` cast.
   *
   * Safe because `Object.entries` returns exactly the runtime keys of the input
   * object; the type of those keys is what the input map already declared them
   * to be.
   */
  const typedEntries = <K extends string, V>(
    obj: Partial<Record<K, V>>,
  ): Array<[K, V]> => Object.entries(obj) as Array<[K, V]>;

  const mergeMeta = (
    oldMeta: Record<string, unknown>,
    newMeta: Record<string, unknown>,
  ): Record<string, unknown> => {
    const newFields: Record<string, unknown> = { ...oldMeta };

    Object.entries(newMeta).forEach(([key, value]) => {
      if (value == null) delete newFields[key];
      else newFields[key] = value;
    });

    return newFields;
  };

  const getValueOrFallback = <T>(
    value: T | null | undefined,
    fallback: T | null | undefined,
  ): T | null => value ?? fallback ?? null;

  const getMetaValue = (properties: unknown): Record<string, unknown> =>
    typeof properties === 'object' &&
    properties !== null &&
    !Array.isArray(properties)
      ? (properties as Record<string, unknown>)
      : {};

  const getItem = async <T>(
    driver: WxtStorageDriver,
    driverKey: string,
    opts: GetItemOptions<T> | undefined,
  ): Promise<T | null> => {
    const res = await driver.getItem(driverKey);
    return getValueOrFallback<T>(
      res as T | null | undefined,
      opts?.fallback ?? opts?.defaultValue,
    );
  };

  const getMeta = async (
    driver: WxtStorageDriver,
    driverKey: string,
  ): Promise<Record<string, unknown>> => {
    const metaKey = getMetaKey(driverKey);
    const res = await driver.getItem(metaKey);
    return getMetaValue(res);
  };

  /**
   * Turn the raw wire form read from `driver.getItem` into the runtime value
   * returned to callers.
   *
   * Pipeline: `raw → serializer.read? → schema.validate → T`.
   *
   * A null raw means "nothing stored yet" — short-circuit to `fallback` (or
   * null if no fallback is set). Non-null values are always run through the
   * full pipeline. On schema failure, the `onValidationError` strategy dictates
   * recovery:
   *
   * - `'throw'` (default): throw a SchemaError
   * - `'fallback'` : return `fallback` (or null)
   * - `'reset'` : clear the invalid value from storage, return `fallback`
   * - Function : return whatever the callback returns
   *
   * When `pipelineOpts.allowReset` is false, the `'reset'` strategy skips the
   * destructive `driver.removeItem` call and behaves like `'fallback'`. Watch
   * callbacks pass this so an invalid `oldValue` can't blow away a valid
   * `newValue` that was just written.
   */
  const processReadValue = async <T>(
    raw: unknown,
    opts: WxtStorageItemOptions<T> | undefined,
    driver: WxtStorageDriver,
    driverKey: string,
    pipelineOpts: { allowReset?: boolean } = {},
  ): Promise<T | null> => {
    const fallback: T | null = opts?.fallback ?? opts?.defaultValue ?? null;

    if (raw == null) return fallback;

    // Schema path: `schema['~standard'].validate` is the sole source of T so
    // `result.value` is returned without any type assertion. If a
    // `serializer.read` is present it deserializes before validation; the
    // schema is still the type authority.
    if (opts?.schema) {
      const preValidation: unknown = opts.serializer?.read
        ? opts.serializer.read(raw)
        : raw;
      const result = await opts.schema['~standard'].validate(preValidation);
      if (result.issues) {
        const strategy = opts.onValidationError ?? 'throw';
        if (strategy === 'throw') {
          throw new SchemaError(result.issues);
        }
        if (strategy === 'fallback') {
          return fallback;
        }
        if (strategy === 'reset') {
          if (pipelineOpts.allowReset !== false) {
            await driver.removeItem(driverKey);
          }
          return fallback;
        }
        // strategy is `(issues, raw) => T` after the string checks above.
        return strategy(result.issues, raw);
      }
      return result.value;
    }

    // Serializer-only path: `serializer.read`'s typed return IS T by
    // WxtStorageItemSerializer<TValue, TRaw>.
    if (opts?.serializer?.read) {
      return opts.serializer.read(raw);
    }

    // Trust boundary: no schema, no serializer. Same guarantee level as the
    // existing typed `getItem<T>` helper — the caller asserted T on
    // defineItem and we hand back whatever storage held.
    return raw as T;
  };

  const setItem = async (
    driver: WxtStorageDriver,
    driverKey: string,
    value: unknown,
  ) => {
    await driver.setItem(driverKey, value ?? null);
  };

  /**
   * Turn the runtime value handed to `defineItem().setValue()` into the raw
   * wire form that hits `driver.setItem`.
   *
   * Pipeline: `T → schema.validate → serializer.write → raw`.
   *
   * Returns both the raw wire form (for storage) and the validated runtime
   * value (for callers that want the schema-transformed form back — e.g. the
   * init path returns `validated` to the caller after storing `raw`).
   *
   * Validation is always applied and always throws on failure — writes never
   * respect `onValidationError` (that setting only affects reads). If the
   * schema transforms the input (e.g. `z.number().transform(...)`), the
   * transformed value is what gets serialized AND what is returned.
   */
  const processWriteValue = async <T>(
    value: T,
    opts: WxtStorageItemOptions<T> | undefined,
  ): Promise<{ raw: unknown; validated: T }> => {
    let validated: T = value;
    if (opts?.schema) {
      const result = await opts.schema['~standard'].validate(value);
      if (result.issues) {
        throw new SchemaError(result.issues);
      }
      validated = result.value;
    }
    const raw = opts?.serializer?.write
      ? opts.serializer.write(validated)
      : validated;
    return { raw, validated };
  };

  const setMeta = async (
    driver: WxtStorageDriver,
    driverKey: string,
    properties: unknown,
  ) => {
    const metaKey = getMetaKey(driverKey);
    const existingFields = getMetaValue(await driver.getItem(metaKey));
    // `properties` is typed `unknown` because upstream `setMeta<T>` on
    // WxtStorage is caller-invented (Phase D). Coerce through
    // `getMetaValue` which enforces the object-shape invariant at runtime.
    const incoming = getMetaValue(properties);
    await driver.setItem(metaKey, mergeMeta(existingFields, incoming));
  };

  const removeItem = async (
    driver: WxtStorageDriver,
    driverKey: string,
    opts: RemoveItemOptions | undefined,
  ) => {
    await driver.removeItem(driverKey);

    if (opts?.removeMeta) {
      const metaKey = getMetaKey(driverKey);
      await driver.removeItem(metaKey);
    }
  };

  const removeMeta = async (
    driver: WxtStorageDriver,
    driverKey: string,
    properties: string | string[] | undefined,
  ) => {
    const metaKey = getMetaKey(driverKey);

    if (properties == null) {
      await driver.removeItem(metaKey);
    } else {
      const newFields = getMetaValue(await driver.getItem(metaKey));
      [properties].flat().forEach((field) => delete newFields[field]);
      await driver.setItem(metaKey, newFields);
    }
  };

  const watch = <T>(
    driver: WxtStorageDriver,
    driverKey: string,
    cb: WatchCallback<T | null>,
  ) =>
    // Contravariance: caller supplies a narrow `WatchCallback<T | null>`;
    // the driver interface is `WatchCallback<unknown>`. The narrow
    // callback can accept the driver's wider payload because the read
    // pipeline validates before invocation (or the caller opted out of
    // narrowing). Cast the callback shape at the boundary.
    driver.watch(driverKey, cb as WatchCallback<unknown>);

  return {
    getItem: (async <T>(
      key: StorageItemKey,
      opts?: GetItemOptions<T>,
    ): Promise<T | null> => {
      const { driver, driverKey } = resolveKey(key);
      return await getItem(driver, driverKey, opts);
    }) as WxtStorage['getItem'],

    getItems: async (keys) => {
      const areaToKeyMap = new Map<StorageArea, string[]>();
      const keyToOptsMap = new Map<
        string,
        GetItemOptions<unknown> | undefined
      >();
      const orderedKeys: StorageItemKey[] = [];

      keys.forEach((key) => {
        let keyStr: StorageItemKey;
        let opts: GetItemOptions<unknown> | undefined;

        if (typeof key === 'string') {
          // key: string
          keyStr = key;
        } else if ('getValue' in key) {
          // key: WxtStorageItem
          keyStr = key.key;
          opts = { fallback: key.fallback };
        } else {
          // key: { key, options }
          keyStr = key.key;
          opts = key.options;
        }

        orderedKeys.push(keyStr);
        const { driverArea, driverKey } = resolveKey(keyStr);
        const areaKeys = areaToKeyMap.get(driverArea) ?? [];

        areaToKeyMap.set(driverArea, areaKeys.concat(driverKey));
        keyToOptsMap.set(keyStr, opts);
      });

      const resultsMap = new Map<StorageItemKey, unknown>();
      await Promise.all(
        Array.from(areaToKeyMap.entries()).map(async ([driverArea, keys]) => {
          const driverResults = await drivers[driverArea].getItems(keys);

          driverResults.forEach((driverResult) => {
            // Template literal narrows automatically: driverArea is
            // StorageArea, driverResult.key is string, so the join is
            // `${StorageArea}:${string}` = StorageItemKey.
            const key: StorageItemKey = `${driverArea}:${driverResult.key}`;
            const opts = keyToOptsMap.get(key);
            const value = getValueOrFallback(
              driverResult.value,
              opts?.fallback ?? opts?.defaultValue,
            );

            resultsMap.set(key, value);
          });
        }),
      );

      return orderedKeys.map((key) => ({
        key,
        value: resultsMap.get(key),
      }));
    },

    getMeta: async (key) => {
      const { driver, driverKey } = resolveKey(key);
      return await getMeta(driver, driverKey);
    },

    getMetas: async (args) => {
      const keys = args.map((arg) => {
        const key = typeof arg === 'string' ? arg : arg.key;
        const { driverArea, driverKey } = resolveKey(key);

        return {
          key,
          driverArea,
          driverKey,
          driverMetaKey: getMetaKey(driverKey),
        };
      });

      const areaToDriverMetaKeysMap = keys.reduce<
        Partial<Record<StorageArea, (typeof keys)[number][]>>
      >((map, key) => {
        map[key.driverArea] ??= [];
        map[key.driverArea]!.push(key);
        return map;
      }, {});

      const resultsMap: Record<string, unknown> = {};
      await Promise.all(
        typedEntries(areaToDriverMetaKeysMap).map(async ([area, keys]) => {
          const areaRes = await browser.storage[area].get(
            keys.map((key) => key.driverMetaKey),
          );
          keys.forEach((key) => {
            resultsMap[key.key] = areaRes[key.driverMetaKey] ?? {};
          });
        }),
      );

      return keys.map((key) => ({
        key: key.key,
        meta: getMetaValue(resultsMap[key.key]),
      }));
    },

    setItem: async (key, value) => {
      const { driver, driverKey } = resolveKey(key);
      await setItem(driver, driverKey, value);
    },

    setItems: async (items) => {
      const areaToKeyValueMap: Partial<
        Record<StorageArea, Array<{ key: string; value: unknown }>>
      > = {};
      items.forEach((item) => {
        const { driverArea, driverKey } = resolveKey(
          'key' in item ? item.key : item.item.key,
        );
        areaToKeyValueMap[driverArea] ??= [];
        areaToKeyValueMap[driverArea].push({
          key: driverKey,
          value: item.value,
        });
      });

      await Promise.all(
        typedEntries(areaToKeyValueMap).map(async ([driverArea, values]) => {
          const driver = getDriver(driverArea);
          await driver.setItems(values);
        }),
      );
    },

    setMeta: async (key, properties) => {
      const { driver, driverKey } = resolveKey(key);
      await setMeta(driver, driverKey, properties);
    },

    setMetas: async (items) => {
      const areaToMetaUpdatesMap: Partial<
        Record<StorageArea, { key: string; properties: unknown }[]>
      > = {};
      items.forEach((item) => {
        const { driverArea, driverKey } = resolveKey(
          'key' in item ? item.key : item.item.key,
        );
        areaToMetaUpdatesMap[driverArea] ??= [];
        areaToMetaUpdatesMap[driverArea].push({
          key: driverKey,
          properties: item.meta,
        });
      });

      await Promise.all(
        typedEntries(areaToMetaUpdatesMap).map(
          async ([storageArea, updates]) => {
            const driver = getDriver(storageArea);
            const metaKeys = updates.map(({ key }) => getMetaKey(key));
            const existingMetas = await driver.getItems(metaKeys);
            const existingMetaMap = Object.fromEntries(
              existingMetas.map(({ key, value }) => [key, getMetaValue(value)]),
            );

            const metaUpdates = updates.map(({ key, properties }) => {
              const metaKey = getMetaKey(key);
              return {
                key: metaKey,
                value: mergeMeta(
                  existingMetaMap[metaKey] ?? {},
                  getMetaValue(properties),
                ),
              };
            });

            await driver.setItems(metaUpdates);
          },
        ),
      );
    },

    removeItem: async (key, opts) => {
      const { driver, driverKey } = resolveKey(key);
      await removeItem(driver, driverKey, opts);
    },

    removeItems: async (keys) => {
      const areaToKeysMap: Partial<Record<StorageArea, string[]>> = {};

      keys.forEach((key) => {
        let keyStr: StorageItemKey;
        let opts: RemoveItemOptions | undefined;

        if (typeof key === 'string') {
          // key: string
          keyStr = key;
        } else if ('getValue' in key) {
          // key: WxtStorageItem
          keyStr = key.key;
        } else if ('item' in key) {
          // key: { item, options }
          keyStr = key.item.key;
          opts = key.options;
        } else {
          // key: { key, options }
          keyStr = key.key;
          opts = key.options;
        }

        const { driverArea, driverKey } = resolveKey(keyStr);
        areaToKeysMap[driverArea] ??= [];
        areaToKeysMap[driverArea].push(driverKey);

        if (opts?.removeMeta) {
          areaToKeysMap[driverArea].push(getMetaKey(driverKey));
        }
      });

      await Promise.all(
        typedEntries(areaToKeysMap).map(async ([driverArea, keys]) => {
          const driver = getDriver(driverArea);
          await driver.removeItems(keys);
        }),
      );
    },

    clear: async (base) => {
      const driver = getDriver(base);
      await driver.clear();
    },

    removeMeta: async (key, properties) => {
      const { driver, driverKey } = resolveKey(key);
      await removeMeta(driver, driverKey, properties);
    },

    snapshot: async (base, opts) => {
      const driver = getDriver(base);
      const data = await driver.snapshot();

      opts?.excludeKeys?.forEach((key) => {
        delete data[key];
        delete data[getMetaKey(key)];
      });

      return data;
    },

    restoreSnapshot: async (base, data) => {
      const driver = getDriver(base);
      await driver.restoreSnapshot(data);
    },

    watch: (key, cb) => {
      const { driver, driverKey } = resolveKey(key);
      return watch(driver, driverKey, cb);
    },

    unwatch() {
      Object.values(drivers).forEach((driver) => {
        driver.unwatch();
      });
    },

    defineItem: (
      key: StorageItemKey,
      opts?: WxtStorageItemOptions<any>,
    ): WxtStorageItem<any, any> => {
      const { driver, driverKey } = resolveKey(key);

      const {
        version: targetVersion = 1,
        migrations = {},
        onMigrationComplete,
        debug = false,
      } = opts ?? {};

      if (targetVersion < 1) {
        throw Error(
          'Storage item version cannot be less than 1. Initial versions should be set to 1, not 0.',
        );
      }

      let needsVersionSet = false;

      const migrate: WxtStorageItem<any, any>['migrate'] = async () => {
        const driverMetaKey = getMetaKey(driverKey);
        const results = await driver.getItems([driverKey, driverMetaKey]);
        // driver.getItems returns one entry per input key; the pair-shape is
        // guaranteed by contract but not by the type. Handle the (never-taken)
        // undefined branches without `!` assertions.
        const value = results[0]?.value;
        // Trust boundary: metadata is stored under `${key}$` and always has
        // shape `{ v?: number, ... }` at runtime. The driver returns
        // `unknown` — coerce through a locally-typed alias.
        const meta = (results[1]?.value ?? {}) as {
          v?: number;
          [k: string]: unknown;
        };

        // Used in setValue to also set the version when needed
        needsVersionSet = value == null && meta?.v == null && !!targetVersion;

        if (value == null) return;

        const currentVersion = meta?.v ?? 1;
        if (currentVersion > targetVersion) {
          throw Error(
            `Version downgrade detected (v${currentVersion} -> v${targetVersion}) for "${key}"`,
          );
        }

        if (currentVersion === targetVersion) {
          return;
        }

        if (debug) {
          console.debug(
            `[@wxt-dev/storage] Running storage migration for ${key}: v${currentVersion} -> v${targetVersion}`,
          );
        }
        const migrationsToRun = Array.from(
          { length: targetVersion - currentVersion },
          (_, i) => currentVersion + i + 1,
        );
        let migratedValue = value;
        for (const migrateToVersion of migrationsToRun) {
          try {
            migratedValue =
              (await migrations?.[migrateToVersion]?.(migratedValue)) ??
              migratedValue;
            if (debug) {
              console.debug(
                `[@wxt-dev/storage] Storage migration processed for version: v${migrateToVersion}`,
              );
            }
          } catch (err) {
            throw new MigrationError(key, migrateToVersion, {
              cause: err,
            });
          }
        }
        await driver.setItems([
          { key: driverKey, value: migratedValue },
          { key: driverMetaKey, value: { ...meta, v: targetVersion } },
        ]);

        if (debug) {
          console.debug(
            `[@wxt-dev/storage] Storage migration completed for ${key} v${targetVersion}`,
            { migratedValue },
          );
        }

        onMigrationComplete?.(migratedValue, targetVersion);
      };

      const migrationsDone =
        opts?.migrations == null
          ? Promise.resolve()
          : migrate().catch((err) => {
              console.error(
                `[@wxt-dev/storage] Migration failed for ${key}`,
                err,
              );
            });

      const initMutex = new Mutex();

      const getFallback = () => opts?.fallback ?? opts?.defaultValue ?? null;

      const getOrInitValue = () =>
        initMutex.runExclusive(async () => {
          const raw = await driver.getItem(driverKey);

          // No init defined — leave the pipeline to the non-init getValue path.
          // This function is also called eagerly via `migrationsDone.then` for
          // every item; running the pipeline here would double-fire it against
          // the same read (once eagerly, once from user getValue).
          if (opts?.init == null) return raw;

          // Init defined + storage already populated: run the read pipeline
          // just like non-init getValue does.
          if (raw != null) {
            return await processReadValue(raw, opts, driver, driverKey);
          }

          // Fresh init: run the write pipeline on the init output so a schema
          // can validate/transform it, and a serializer.write produces the
          // storage form.
          const initialized = await opts.init();
          const { raw: rawToStore, validated } = await processWriteValue(
            initialized,
            opts,
          );
          await driver.setItem(driverKey, rawToStore);
          if (targetVersion > 1) {
            await setMeta(driver, driverKey, { v: targetVersion });
          }
          return validated;
        });

      // Fire-and-forget eager init: kicks off `init()` right after any
      // migrations resolve so the value is present before the first user
      // getValue call. Errors here are surfaced when the user actually reads
      // — they hit the mutex, re-run getOrInitValue, and get the same error
      // via a properly-awaited promise. Swallow here to avoid unhandled
      // rejection warnings when the schema on an init item fails.
      migrationsDone.then(getOrInitValue).catch((err) => {
        if (debug) {
          console.debug(
            `[@wxt-dev/storage] Eager init failed for ${key}; will surface on next read`,
            err,
          );
        }
      });

      return {
        key,

        get defaultValue() {
          return getFallback();
        },
        get fallback() {
          return getFallback();
        },

        getValue: async () => {
          await migrationsDone;

          if (opts?.init) {
            return await getOrInitValue();
          }

          // Non-init read path: pull the raw value straight from the driver so
          // the pipeline (deserialize → validate → onValidationError) sees the
          // untouched wire form. Fallback logic is handled inside the pipeline.
          const raw = await driver.getItem(driverKey);
          return await processReadValue(raw, opts, driver, driverKey);
        },

        getMeta: async () => {
          await migrationsDone;

          return await getMeta(driver, driverKey);
        },

        setValue: async (value) => {
          await migrationsDone;

          const { raw } = await processWriteValue(value, opts);

          if (needsVersionSet) {
            needsVersionSet = false;
            await Promise.all([
              // Note: These calls cannot be done in a single `setItems` call;
              // metadata needs to be merged together with existing data and
              // setItems overwrites the whole value without merging.
              setItem(driver, driverKey, raw),
              setMeta(driver, driverKey, { v: targetVersion }),
            ]);
          } else {
            await setItem(driver, driverKey, raw);
          }
        },

        setMeta: async (properties) => {
          await migrationsDone;

          return await setMeta(driver, driverKey, properties);
        },

        removeValue: async (opts) => {
          await migrationsDone;

          return await removeItem(driver, driverKey, opts);
        },

        removeMeta: async (properties) => {
          await migrationsDone;

          return await removeMeta(driver, driverKey, properties);
        },

        watch: (cb) =>
          watch(driver, driverKey, async (newValueRaw, oldValueRaw) => {
            // Run both raw values through the read pipeline so the callback
            // sees the same T that getValue() would produce. `allowReset:
            // false` disables the destructive 'reset' side effect inside
            // watch — otherwise an invalid oldValue arriving alongside a
            // freshly-written valid newValue would wipe the newValue.
            try {
              const [newValue, oldValue] = await Promise.all([
                processReadValue(newValueRaw, opts, driver, driverKey, {
                  allowReset: false,
                }),
                processReadValue(oldValueRaw, opts, driver, driverKey, {
                  allowReset: false,
                }),
              ]);
              cb(newValue ?? getFallback(), oldValue ?? getFallback());
            } catch (error) {
              console.error(
                `[@wxt-dev/storage] watch: pipeline failed for ${key}, callback skipped`,
                error,
              );
            }
          }),

        migrate,
      };
    },
  };
}

function createDriver(storageArea: StorageArea): WxtStorageDriver {
  const getStorageArea = () => {
    if (browser.runtime == null) {
      throw Error(`'wxt/storage' must be loaded in a web extension environment

 - If thrown during a build, see https://github.com/wxt-dev/wxt/issues/371
 - If thrown during tests, mock 'wxt/browser' correctly. See https://wxt.dev/guide/go-further/testing.html
`);
    }

    if (browser.storage == null) {
      throw Error(
        "You must add the 'storage' permission to your manifest to use 'wxt/storage'",
      );
    }

    const area = browser.storage[storageArea];
    if (area == null)
      throw Error(`"browser.storage.${storageArea}" is undefined`);

    return area;
  };

  const watchListeners = new Set<(changes: StorageAreaChanges) => void>();

  return {
    getItem: async (key: string): Promise<unknown> => {
      const res = await getStorageArea().get<Record<string, unknown>>(key);
      return res[key] ?? null;
    },

    getItems: async (keys) => {
      // `.get` accepts a mutable `string[]`; the driver interface hands us
      // `readonly string[]`. Copy at the boundary rather than widening the
      // public contract.
      const result = await getStorageArea().get([...keys]);
      return keys.map((key) => ({ key, value: result[key] ?? null }));
    },

    setItem: async (key, value) => {
      if (value == null) {
        await getStorageArea().remove(key);
      } else {
        await getStorageArea().set({ [key]: value });
      }
    },

    setItems: async (values) => {
      const map = values.reduce<Record<string, unknown>>(
        (map, { key, value }) => {
          map[key] = value;
          return map;
        },
        {},
      );

      await getStorageArea().set(map);
    },

    removeItem: async (key) => {
      await getStorageArea().remove(key);
    },

    removeItems: async (keys) => {
      // `.remove` on browser.storage accepts `string | number | (string |
      // number)[]`; the driver interface hands us `readonly string[]`.
      // Copy at the boundary rather than widening the public contract.
      await getStorageArea().remove([...keys]);
    },

    clear: async () => {
      await getStorageArea().clear();
    },

    snapshot: async () => {
      return await getStorageArea().get();
    },

    restoreSnapshot: async (data) => {
      await getStorageArea().set(data);
    },

    watch(key: StorageItemKey, cb: WatchCallback<unknown>): Unwatch {
      const listener = (changes: StorageAreaChanges) => {
        const change = changes[key] as {
          newValue?: unknown;
          oldValue?: unknown;
        } | null;

        if (change == null || dequal(change.newValue, change.oldValue)) return;

        cb(change.newValue ?? null, change.oldValue ?? null);
      };

      getStorageArea().onChanged.addListener(listener);
      watchListeners.add(listener);

      return () => {
        getStorageArea().onChanged.removeListener(listener);
        watchListeners.delete(listener);
      };
    },

    unwatch() {
      watchListeners.forEach((listener) => {
        getStorageArea().onChanged.removeListener(listener);
      });
      watchListeners.clear();
    },
  };
}

export interface WxtStorage {
  /**
   * Get an item from storage, or return `null` if it doesn't exist.
   *
   * @example
   *   await storage.getItem<number>('local:installDate');
   */
  /**
   * Get an item from storage, or return `null` if it doesn't exist.
   *
   * The overload without a `fallback` returns `Promise<unknown>` — the value is
   * whatever bytes storage happens to hold. Narrow the return type at the call
   * site with a schema or an explicit assertion.
   *
   * When `opts.fallback` is provided, `TValue` is inferred from the fallback
   * and drives the return type honestly (fallback and return both share
   * `TValue`), so no cast is needed.
   *
   * @example
   *   const raw = await storage.getItem('local:installDate');
   *   // raw: unknown
   *   const withFallback = await storage.getItem('local:count', {
   *     fallback: 0,
   *   });
   *   // withFallback: number
   */
  getItem<TValue>(
    key: StorageItemKey,
    opts: GetItemOptions<TValue> & { fallback: TValue },
  ): Promise<TValue>;

  getItem(
    key: StorageItemKey,
    opts?: GetItemOptions<unknown>,
  ): Promise<unknown>;

  /**
   * Get multiple items from storage. The return order is guaranteed to be the
   * same as the order requested.
   *
   * @example
   *   await storage.getItems(['local:installDate', 'session:someCounter']);
   */
  getItems(
    keys: ReadonlyArray<
      | StorageItemKey
      | WxtStorageItem<any, any>
      | { key: StorageItemKey; options?: GetItemOptions<unknown> }
    >,
  ): Promise<Array<{ key: StorageItemKey; value: unknown }>>;

  /**
   * Return an object containing metadata about the key. Object is stored at
   * `key + "$"`. If value is not an object, it returns an empty object.
   *
   * Returns `Record<string, unknown>` — metadata is arbitrary at the storage
   * layer. Narrow at the call site if you need a specific shape.
   *
   * @example
   *   await storage.getMeta('local:installDate');
   */
  getMeta(key: StorageItemKey): Promise<Record<string, unknown>>;

  /**
   * Get the metadata of multiple storage items.
   *
   * @param keys List of keys or items to get the metadata of.
   * @returns An array containing storage keys and their metadata.
   */
  getMetas(
    keys: ReadonlyArray<StorageItemKey | WxtStorageItem<any, any>>,
  ): Promise<Array<{ key: StorageItemKey; meta: Record<string, unknown> }>>;

  /**
   * Set a value in storage. Setting a value to `null` or `undefined` is
   * equivalent to calling `removeItem`.
   *
   * Accepts `unknown` — the value goes to storage as-is. If you want type-
   * checked writes, define the item via `defineItem` with a `schema`.
   *
   * @example
   *   await storage.setItem('local:installDate', Date.now());
   */
  setItem(key: StorageItemKey, value: unknown): Promise<void>;

  /**
   * Set multiple values in storage. If a value is set to `null` or `undefined`,
   * the key is removed.
   *
   * @example
   *   await storage.setItem([
   *   { key: "local:installDate", value: Date.now() },
   *   { key: "session:someCounter, value: 5 },
   *   ]);
   */
  setItems(
    values: ReadonlyArray<
      | { key: StorageItemKey; value: unknown }
      | { item: WxtStorageItem<any, any>; value: unknown }
    >,
  ): Promise<void>;

  /**
   * Sets metadata properties. If some properties are already set, but are not
   * included in the `properties` parameter, they will not be removed.
   *
   * @example
   *   await storage.setMeta('local:installDate', { appVersion });
   */
  setMeta(
    key: StorageItemKey,
    properties: Record<string, unknown> | null,
  ): Promise<void>;

  /**
   * Set the metadata of multiple storage items.
   *
   * @param metas List of storage keys or items and metadata to set for each.
   */
  setMetas(
    metas: ReadonlyArray<
      | { key: StorageItemKey; meta: Record<string, unknown> }
      | { item: WxtStorageItem<any, any>; meta: Record<string, unknown> }
    >,
  ): Promise<void>;

  /**
   * Removes an item from storage.
   *
   * @example
   *   await storage.removeItem('local:installDate');
   */
  removeItem(key: StorageItemKey, opts?: RemoveItemOptions): Promise<void>;

  /** Remove a list of keys from storage. */
  removeItems(
    keys: Array<
      | StorageItemKey
      | WxtStorageItem<any, any>
      | { key: StorageItemKey; options?: RemoveItemOptions }
      | { item: WxtStorageItem<any, any>; options?: RemoveItemOptions }
    >,
  ): Promise<void>;

  /** Removes all items from the provided storage area. */
  clear(base: StorageArea): Promise<void>;

  /**
   * Remove the entire metadata for a key, or specific properties by name.
   *
   * @example
   *   // Remove all metadata properties from the item
   *   await storage.removeMeta('local:installDate');
   *
   *   // Remove only specific the "v" field
   *   await storage.removeMeta('local:installDate', 'v');
   */
  removeMeta(
    key: StorageItemKey,
    properties?: string | string[],
  ): Promise<void>;

  /** Return all the items in storage. */
  snapshot(
    base: StorageArea,
    opts?: SnapshotOptions,
  ): Promise<Record<string, unknown>>;

  /**
   * Restores the results of `snapshot`. If new properties have been saved since
   * the snapshot, they are not overridden. Only values existing in the snapshot
   * are overridden.
   */
  restoreSnapshot(
    base: StorageArea,
    data: Record<string, unknown>,
  ): Promise<void>;

  /** Watch for changes to a specific key in storage. */
  watch(key: StorageItemKey, cb: WatchCallback<unknown>): Unwatch;

  /** Remove all watch listeners. */
  unwatch(): void;

  /**
   * Define a storage item with a default value, type, or versioning.
   *
   * Read full docs: https://wxt.dev/storage.html#defining-storage-items
   */
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
  >(
    key: TKey,
  ): WxtStorageItem<TValue | null, TMetadata, TKey>;
  // --- schema-carrying overloads ---
  // These sit above the plain overloads so TypeScript picks them up whenever
  // `schema` is present, driving TValue from the schema's output type.
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
  >(
    key: TKey,
    options: WxtStorageItemOptions<
      StandardSchemaV1.InferOutput<TSchema>,
      TRaw
    > & {
      schema: TSchema;
      fallback: StandardSchemaV1.InferOutput<TSchema>;
    },
  ): WxtStorageItem<StandardSchemaV1.InferOutput<TSchema>, TMetadata, TKey>;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
  >(
    key: TKey,
    options: WxtStorageItemOptions<
      StandardSchemaV1.InferOutput<TSchema>,
      TRaw
    > & {
      schema: TSchema;
      defaultValue: StandardSchemaV1.InferOutput<TSchema>;
    },
  ): WxtStorageItem<StandardSchemaV1.InferOutput<TSchema>, TMetadata, TKey>;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
  >(
    key: TKey,
    options: WxtStorageItemOptions<
      StandardSchemaV1.InferOutput<TSchema>,
      TRaw
    > & {
      schema: TSchema;
      init: () =>
        | StandardSchemaV1.InferOutput<TSchema>
        | Promise<StandardSchemaV1.InferOutput<TSchema>>;
    },
  ): WxtStorageItem<StandardSchemaV1.InferOutput<TSchema>, TMetadata, TKey>;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
  >(
    key: TKey,
    options: WxtStorageItemOptions<
      StandardSchemaV1.InferOutput<TSchema>,
      TRaw
    > & {
      schema: TSchema;
    },
  ): WxtStorageItem<
    StandardSchemaV1.InferOutput<TSchema> | null,
    TMetadata,
    TKey
  >;
  // --- non-schema overloads ---
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
  >(
    key: TKey,
    options: WxtStorageItemOptions<TValue, TRaw> & { fallback: TValue },
  ): WxtStorageItem<TValue, TMetadata, TKey>;
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
  >(
    key: TKey,
    options: WxtStorageItemOptions<TValue, TRaw> & { defaultValue: TValue },
  ): WxtStorageItem<TValue, TMetadata, TKey>;
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
  >(
    key: TKey,
    options: WxtStorageItemOptions<TValue, TRaw> & {
      init: () => TValue | Promise<TValue>;
    },
  ): WxtStorageItem<TValue, TMetadata, TKey>;
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
  >(
    key: TKey,
    options: WxtStorageItemOptions<TValue, TRaw>,
  ): WxtStorageItem<TValue | null, TMetadata, TKey>;
}

interface WxtStorageDriver {
  getItem(key: string): Promise<unknown>;
  getItems(
    keys: readonly string[],
  ): Promise<Array<{ key: string; value: unknown }>>;
  setItem(key: string, value: unknown): Promise<void>;
  setItems(
    values: ReadonlyArray<{ key: string; value: unknown }>,
  ): Promise<void>;
  removeItem(key: string): Promise<void>;
  removeItems(keys: readonly string[]): Promise<void>;
  clear(): Promise<void>;
  snapshot(): Promise<Record<string, unknown>>;
  restoreSnapshot(data: Record<string, unknown>): Promise<void>;
  watch(key: string, cb: WatchCallback<unknown>): Unwatch;
  unwatch(): void;
}

export interface WxtStorageItem<
  TValue,
  TMetadata extends Record<string, unknown>,
  TKey extends StorageItemKey = StorageItemKey,
> {
  /**
   * The storage key passed when creating the storage item. When `defineItem` is
   * called with a string literal (`'local:theme'`), this is narrowed to that
   * exact literal; when passed a wider `StorageItemKey` value it stays as the
   * union.
   */
  key: TKey;

  /** @deprecated Renamed to fallback, use it instead. */
  defaultValue: TValue;

  /** The value provided by the `fallback` option. */
  fallback: TValue;

  /** Get the latest value from storage. */
  getValue(): Promise<TValue>;

  /** Get metadata. */
  getMeta(): Promise<NullablePartial<TMetadata>>;

  /** Set the value in storage. */
  setValue(value: TValue): Promise<void>;

  /** Set metadata properties. */
  setMeta(properties: NullablePartial<TMetadata>): Promise<void>;

  /** Remove the value from storage. */
  removeValue(opts?: RemoveItemOptions): Promise<void>;

  /** Remove all metadata or certain properties from metadata. */
  removeMeta(properties?: string[]): Promise<void>;

  /** Listen for changes to the value in storage. */
  watch(cb: WatchCallback<TValue>): Unwatch;

  /**
   * If there are migrations defined on the storage item, migrate to the latest
   * version.
   *
   * **This function is ran automatically whenever the extension updates**, so
   * you don't have to call it manually.
   */
  migrate(): Promise<void>;
}

/**
 * Internal `resolveKey` return shape: pure `KeyParts<K>` (parsed from the
 * template literal) plus the runtime driver handle. Kept in this file because
 * it references `WxtStorageDriver`, an internal interface.
 *
 * @internal
 */
type ResolvedKey<K extends StorageItemKey> = KeyParts<K> & {
  driver: WxtStorageDriver;
};

// GetItemOptions, RemoveItemOptions, SnapshotOptions moved to ./types.

// WxtStorageItemOptions, WxtStorageItemSerializer, OnValidationError moved
// to ./types.

/**
 * Wrap a synchronous or asynchronous parse function into a Standard Schema.
 *
 * Use this when your validator does not conform to Standard Schema natively —
 * for example TypeBox (`Value.Parse`), io-ts (`.decode`), or hand-rolled
 * parsers. The `parse` function must return the parsed value on success or
 * throw on failure.
 *
 * @example
 *   ```ts
 *   import { Type, Value } from '@sinclair/typebox';
 *   const Theme = Type.Union([Type.Literal('light'), Type.Literal('dark')]);
 *
 *   const theme = storage.defineItem('local:theme', {
 *     schema: defineSchema<'light' | 'dark'>((v) => Value.Parse(Theme, v)),
 *   });
 *   ```;
 */
export function defineSchema<T>(
  parse: (value: unknown) => T | Promise<T>,
): StandardSchemaV1<unknown, T> {
  return {
    '~standard': {
      version: 1,
      vendor: '@wxt-dev/storage/defineSchema',
      validate: async (value: unknown): Promise<StandardSchemaV1.Result<T>> => {
        try {
          return { value: await parse(value) };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return { issues: [{ message }] };
        }
      },
    },
  };
}

// StorageAreaChanges, NullablePartial, WatchCallback, Unwatch moved to
// ./types.

export class MigrationError extends Error {
  constructor(
    public key: string,
    public version: number,
    options?: ErrorOptions,
  ) {
    super(`v${version} migration failed for "${key}"`, options);
  }
}
