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
  DeepReadonly,
  GetItemOptions,
  GetItemsInputElement,
  GetItemsResult,
  GetMetasInputElement,
  GetMetasResult,
  MetaKey,
  MigrationTuple,
  NullablePartial,
  OnValidationError,
  Prettify,
  RemoveItemOptions,
  SnapshotOptions,
  StorageArea,
  StorageAreaChanges,
  StorageItemKey,
  Unwatch,
  WatchCallback,
  Widen,
  WritableDeep,
  WxtStorageItemOptions,
  WxtStorageItemLike,
} from './types';

export type {
  GetItemOptions,
  GetItemsInputElement,
  GetItemsResult,
  GetMetasInputElement,
  GetMetasResult,
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

// Internal per-item batch hooks, keyed by item identity so nothing leaks
// through the public `WxtStorageItem` interface / generated `.d.ts`.
interface ItemBatchHooks {
  ready: () => Promise<void>;
  processRead: (raw: unknown) => Promise<unknown>;
}
const itemBatchHooks = new WeakMap<object, ItemBatchHooks>();

export const storage = createStorage();

function createStorage(): WxtStorage {
  const drivers = {
    local: createDriver('local'),
    session: createDriver('session'),
    sync: createDriver('sync'),
    managed: createDriver('managed'),
  } as const;

  const getDriver = (area: StorageArea) => {
    const driver = drivers[area];
    if (driver == null) {
      const areaNames = Object.keys(drivers).join(', ');
      throw Error(`Invalid area "${area}". Options: ${areaNames}`);
    }
    return driver;
  };

  /**
   * Runtime guard that narrows `WxtStorageDriver<StorageArea>` to a
   * `MutableStorageDriver` for non-`'managed'` areas. `chrome.storage.managed`
   * rejects writes at runtime; this catches them at the WXT boundary.
   */
  function assertMutable(
    driver: WxtStorageDriver,
  ): asserts driver is MutableStorageDriver<Exclude<StorageArea, 'managed'>> {
    if (driver.area === 'managed') {
      throw Error(
        `Cannot write to \`browser.storage.managed\` — it is read-only. ` +
          `Managed policy is set by admins and cannot be modified from an extension.`,
      );
    }
  }

  const resolveKey = <const K extends StorageItemKey>(key: K) => {
    const deliminatorIndex = key.indexOf(':');
    const driverArea = key.substring(0, deliminatorIndex) as StorageArea;
    const driverKey = key.substring(
      deliminatorIndex + 1,
    ) as K extends `${StorageArea}:${infer R}` ? R : never;
    if (driverKey == null) {
      throw Error(
        `Storage key should be in the form of "area:key", but received "${key}"`,
      );
    }
    return {
      driverArea,
      driverKey,
      driver: getDriver(driverArea),
    };
  };

  const getMetaKey = <const K extends string>(key: K): MetaKey<K> => `${key}$`;

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

  /**
   * Merge a raw driver value with the caller's fallback. `DeepReadonly<T>` in
   * accepts narrow-readonly literals from `<const>` inference at the call site;
   * internal use widens back to `T` — read-only pipeline, no mutation.
   */
  const getValueOrFallback = <T>(
    value: T | null | undefined,
    fallback: DeepReadonly<T> | null | undefined,
  ): T | null => value ?? (fallback as T | null | undefined) ?? null;

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

  const getMetaValue = (properties: unknown): Record<string, unknown> =>
    isRecord(properties) ? properties : {};

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
   * Read pipeline: `raw → serializer.read? → schema.validate → T`.
   *
   * `raw == null` short-circuits to `fallback`. Schema failures apply the
   * `onValidationError` strategy (`'throw'` | `'fallback'` | `'reset'` |
   * `(issues, raw) => T`). `pipelineOpts.allowReset: false` disables the
   * destructive `driver.removeItem` in the `'reset'` branch — watch callbacks
   * pass this so an invalid oldValue can't wipe a freshly-written valid one.
   */
  const processReadValue = async <T>(
    raw: unknown,
    opts: WxtStorageItemOptions<T> | undefined,
    driver: WxtStorageDriver,
    driverKey: string,
    pipelineOpts: { allowReset?: boolean } = {},
  ): Promise<T | null> => {
    // DeepReadonly→T covariance boundary. See getValueOrFallback.
    const fallback: T | null =
      ((opts?.fallback ?? opts?.defaultValue) as T | null | undefined) ?? null;

    if (raw == null) return fallback;

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
            assertMutable(driver);
            await driver.removeItem(driverKey);
          }
          return fallback;
        }
        return strategy(result.issues, raw);
      }
      return result.value;
    }

    if (opts?.serializer?.read) {
      return opts.serializer.read(raw);
    }

    // No schema, no serializer: trust the caller's declared T.
    return raw as T;
  };

  const setItem = async (
    driver: WxtStorageDriver,
    driverKey: string,
    value: unknown,
  ) => {
    assertMutable(driver);
    await driver.setItem(driverKey, value ?? null);
  };

  /**
   * Write pipeline: `T → schema.validate → serializer.write → raw`.
   *
   * Returns both the raw wire form and the (possibly schema-transformed)
   * runtime value. Validation always throws on failure — `onValidationError` is
   * a read-only setting.
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
    properties: Record<string, unknown> | null,
  ) => {
    const metaKey = getMetaKey(driverKey);
    const existingFields = getMetaValue(await driver.getItem(metaKey));
    const incoming = getMetaValue(properties);
    assertMutable(driver);
    await driver.setItem(metaKey, mergeMeta(existingFields, incoming));
  };

  const removeItem = async (
    driver: WxtStorageDriver,
    driverKey: string,
    opts: RemoveItemOptions | undefined,
  ) => {
    assertMutable(driver);
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
      assertMutable(driver);
      await driver.removeItem(metaKey);
    } else {
      const newFields = getMetaValue(await driver.getItem(metaKey));
      [properties].flat().forEach((field) => delete newFields[field]);
      assertMutable(driver);
      await driver.setItem(metaKey, newFields);
    }
  };

  const watch = <T>(
    driver: WxtStorageDriver,
    driverKey: string,
    cb: WatchCallback<T | null>,
  ) =>
    // Contravariance boundary: driver.watch expects WatchCallback<unknown>,
    // caller passes narrow WatchCallback<T | null>. Safe because the pipeline
    // validates before invoking the callback.
    driver.watch(driverKey, cb as WatchCallback<unknown>);

  return {
    getItem: async <T, const K extends StorageItemKey>(
      key: K,
      opts?: GetItemOptions<T>,
    ) => {
      const { driver, driverKey } = resolveKey(key);
      return await getItem(driver, driverKey, opts);
    },

    getItems: (async <const T extends ReadonlyArray<GetItemsInputElement>>(
      keys: T,
    ) => {
      // One slot per input element — duplicate keys with different
      // options each apply their own fallback.
      type Slot =
        | {
            readonly kind: 'raw';
            readonly key: StorageItemKey;
            readonly opts: GetItemOptions<unknown> | undefined;
          }
        | {
            readonly kind: 'item';
            readonly key: StorageItemKey;
            readonly item: WxtStorageItemLike<unknown, StorageItemKey>;
          };
      const slots: Slot[] = [];
      const areaToKeyMap = new Map<StorageArea, string[]>();

      const trackKey = (key: StorageItemKey) => {
        const { driverArea, driverKey } = resolveKey(key);
        const areaKeys = areaToKeyMap.get(driverArea) ?? [];
        areaToKeyMap.set(driverArea, areaKeys.concat(driverKey));
      };

      keys.forEach((key) => {
        if (typeof key === 'string') {
          slots.push({ kind: 'raw', key, opts: undefined });
          trackKey(key);
        } else if ('getValue' in key) {
          slots.push({ kind: 'item', key: key.key, item: key });
          trackKey(key.key);
        } else {
          slots.push({ kind: 'raw', key: key.key, opts: key.options });
          trackKey(key.key);
        }
      });

      // Await migrations + eager init for every item slot BEFORE the raw
      // batch fetch. Otherwise the batch captures pre-migration data and a
      // subsequent onValidationError: 'reset' could destroy the newly
      // migrated value.
      await Promise.all(
        slots.flatMap((slot) => {
          if (slot.kind !== 'item') return [];
          const hooks = itemBatchHooks.get(slot.item);
          return hooks ? [hooks.ready()] : [];
        }),
      );

      const rawByKey = new Map<StorageItemKey, unknown>();
      await Promise.all(
        Array.from(areaToKeyMap.entries()).map(async ([driverArea, keys]) => {
          const driverResults = await drivers[driverArea].getItems(keys);
          driverResults.forEach((driverResult) => {
            const key: StorageItemKey = `${driverArea}:${driverResult.key}`;
            rawByKey.set(key, driverResult.value);
          });
        }),
      );

      return await Promise.all(
        slots.map(async (slot) => {
          if (slot.kind === 'item') {
            const raw = rawByKey.get(slot.key);
            const hooks = itemBatchHooks.get(slot.item);
            const value = hooks
              ? await hooks.processRead(raw)
              : await slot.item.getValue();
            return { key: slot.key, value };
          }
          return {
            key: slot.key,
            value: getValueOrFallback(
              rawByKey.get(slot.key),
              slot.opts?.fallback ?? slot.opts?.defaultValue,
            ),
          };
        }),
      );
    }) as WxtStorage['getItems'],

    getMeta: (async <const K extends StorageItemKey>(key: K) => {
      const { driver, driverKey } = resolveKey(key);
      return await getMeta(driver, driverKey);
    }) as WxtStorage['getMeta'],

    getMetas: (async <const T extends ReadonlyArray<GetMetasInputElement>>(
      args: T,
    ) => {
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
        Partial<
          Record<
            StorageArea,
            Array<{
              readonly key: StorageItemKey;
              readonly driverArea: StorageArea;
              readonly driverKey: string;
              readonly driverMetaKey: MetaKey<string>;
            }>
          >
        >
      >((map, key) => {
        const bucket = (map[key.driverArea] ??= []);
        bucket.push(key);
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
    }) as WxtStorage['getMetas'],

    setItem: async <const K extends StorageItemKey>(key: K, value: unknown) => {
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
          assertMutable(driver);
          await driver.setItems(values);
        }),
      );
    },

    setMeta: async <const K extends StorageItemKey>(
      key: K,
      properties: Record<string, unknown> | null,
    ) => {
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

            assertMutable(driver);
            await driver.setItems(metaUpdates);
          },
        ),
      );
    },

    removeItem: async <const K extends StorageItemKey>(
      key: K,
      opts?: RemoveItemOptions,
    ) => {
      const { driver, driverKey } = resolveKey(key);
      await removeItem(driver, driverKey, opts);
    },

    removeItems: async (keys) => {
      const areaToKeysMap: Partial<Record<StorageArea, string[]>> = {};

      keys.forEach((key) => {
        let keyStr: StorageItemKey;
        let opts: RemoveItemOptions | undefined;

        if (typeof key === 'string') {
          keyStr = key;
        } else if ('getValue' in key) {
          keyStr = key.key;
        } else if ('item' in key) {
          keyStr = key.item.key;
          opts = key.options;
        } else {
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
          assertMutable(driver);
          await driver.removeItems(keys);
        }),
      );
    },

    clear: async (base) => {
      const driver = getDriver(base);
      assertMutable(driver);
      await driver.clear();
    },

    removeMeta: async <const K extends StorageItemKey>(
      key: K,
      properties?: string | string[],
    ) => {
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
      assertMutable(driver);
      await driver.restoreSnapshot(data);
    },

    watch: <const K extends StorageItemKey>(
      key: K,
      cb: WatchCallback<unknown>,
    ) => {
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
    ): WxtStorageItem<any, any, any, any, any, any, any> => {
      const { driver, driverKey } = resolveKey(key);

      const {
        version: targetVersion = 1,
        migrations = [],
        onMigrationComplete,
        debug = false,
      } = opts ?? {};

      if (targetVersion < 1) {
        throw Error(
          'Storage item version cannot be less than 1. Initial versions should be set to 1, not 0.',
        );
      }

      let needsVersionSet = false;

      const migrate = async () => {
        const driverMetaKey = getMetaKey(driverKey);
        const results = await driver.getItems([driverKey, driverMetaKey]);
        const value = results[0]?.value;
        // meta.v is trusted only when it's a positive integer.
        const rawMetaValue = results[1]?.value;
        const meta: Record<string, unknown> = isRecord(rawMetaValue)
          ? rawMetaValue
          : {};
        const rawV = meta['v'];
        const storedVersion: number | undefined =
          typeof rawV === 'number' && Number.isInteger(rawV) && rawV >= 1
            ? rawV
            : undefined;

        // Set version alongside the value in setValue when we're on v1+ but
        // storage is empty.
        needsVersionSet =
          value == null && storedVersion == null && !!targetVersion;

        if (value == null) return;

        const currentVersion = storedVersion ?? 1;
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
            // Positional tuple: index N-2 migrates vN-1 → vN.
            migratedValue =
              (await migrations?.[migrateToVersion - 2]?.(migratedValue)) ??
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
        // Route migrated value through write pipeline so schema + serializer
        // apply before persisting. Failures throw MigrationError so the
        // version stays un-bumped and next load retries.
        let rawForStorage: unknown = migratedValue;
        if (opts?.schema || opts?.serializer?.write) {
          try {
            const { raw, validated } = await processWriteValue(
              migratedValue,
              opts,
            );
            rawForStorage = raw;
            migratedValue = validated;
          } catch (err) {
            if (err instanceof SchemaError) {
              throw new MigrationError(key, targetVersion, { cause: err });
            }
            throw err;
          }
        }
        assertMutable(driver);
        await driver.setItems([
          { key: driverKey, value: rawForStorage },
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

          // Non-init item: skip. Eager `migrationsDone.then(getOrInitValue)`
          // runs this for every item; the pipeline is left to user getValue.
          if (opts?.init == null) return raw;

          if (raw != null) {
            return await processReadValue(raw, opts, driver, driverKey);
          }

          // Fresh init: run write pipeline so schema validates and
          // serializer.write produces the storage form.
          const initialized = await opts.init();
          const { raw: rawToStore, validated } = await processWriteValue(
            initialized,
            opts,
          );
          assertMutable(driver);
          await driver.setItem(driverKey, rawToStore);
          if (targetVersion > 1) {
            await setMeta(driver, driverKey, { v: targetVersion });
          }
          return validated;
        });

      // Readiness: migration finish + eager init (init items only). Batch
      // APIs await this before reading raw so they never see pre-migration
      // state. Non-init items skip the eager driver.getItem — their
      // readiness reduces to `migrationsDone`.
      const readyPromise: Promise<unknown> = opts?.init
        ? migrationsDone.then(getOrInitValue)
        : migrationsDone;
      readyPromise.catch((err) => {
        if (debug) {
          console.debug(
            `[@wxt-dev/storage] Eager init failed for ${key}; will surface on next read`,
            err,
          );
        }
      });

      const item: WxtStorageItem<any, any, any, any, any, any, any> = {
        key,
        area: driver.area,

        get version() {
          return opts?.version ?? 1;
        },

        get debug() {
          return opts?.debug ?? false;
        },

        get onValidationError() {
          return opts?.onValidationError ?? 'throw';
        },

        get schema() {
          return opts?.schema;
        },

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
            // Route both raws through the read pipeline so the callback sees
            // the same T as getValue(). `allowReset: false` prevents an invalid
            // oldValue from wiping a freshly-written valid newValue.
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

      // Register batch hooks against the item's identity so `getItems`
      // can route pre-fetched raw values through the pipeline without
      // exposing internals on the public interface. `allowReset: false`
      // is a safety belt: if a stale raw reaches processReadValue on the
      // batch path, we don't destructively `driver.removeItem` on schema
      // failure (that would delete a value the user just wrote).
      itemBatchHooks.set(item, {
        ready: async () => {
          await readyPromise;
        },
        processRead: async (raw) => {
          if (opts?.init) {
            // Init items: routing raw through processReadValue would ignore
            // fresh init state. Delegate to the same code path as getValue().
            return await getOrInitValue();
          }
          const processed = await processReadValue(
            raw,
            opts,
            driver,
            driverKey,
            { allowReset: false },
          );
          return processed ?? getFallback();
        },
      });

      return item;
    },
  };
}

function createDriver<const TArea extends StorageArea>(
  storageArea: TArea,
): WxtStorageDriver<TArea> {
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
    area: storageArea,

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
  } as WxtStorageDriver<TArea>;
  // ^ Documented boundary cast: the runtime object literal always carries the
  // full mutable surface (setItem/setItems/removeItem/removeItems/clear/
  // restoreSnapshot). When `TArea = 'managed'`, `WxtStorageDriver<TArea>`
  // resolves to `ReadonlyStorageDriver`, which type-hides those mutations at
  // consumer sites — but the impl still HAS them (the browser's own
  // `chrome.storage.managed` API is what rejects writes at runtime). Object
  // literals trigger TS excess-property checking against the conditional
  // Readonly branch, but the underlying value is a valid
  // `MutableStorageDriver<TArea>` — the cast erases that check at exactly one
  // boundary and no runtime behavior changes.
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
  getItem<TValue, const K extends StorageItemKey = StorageItemKey>(
    key: K,
    // Fallback is accepted as `DeepReadonly<TValue>` so narrow-readonly
    // literals produced by `<const>` inference in `defineItem` flow through
    // without a cast. Return is `WritableDeep<TValue>` so a narrow-readonly
    // `TValue` inferred from the fallback widens back to its mutable shape
    // at the assignment boundary (`const x: T = await getItem(...)` — T is
    // typically mutable, and the widened return matches).
    opts: GetItemOptions<TValue> & { fallback: DeepReadonly<TValue> },
  ): Promise<WritableDeep<TValue>>;

  getItem<const K extends StorageItemKey = StorageItemKey>(
    key: K,
    opts?: GetItemOptions<unknown>,
  ): Promise<unknown>;

  /**
   * Get multiple items from storage. The return order is guaranteed to be the
   * same as the order requested.
   *
   * @example
   *   await storage.getItems(['local:installDate', 'session:someCounter']);
   */
  getItems<const T extends ReadonlyArray<GetItemsInputElement>>(
    keys: T,
  ): Promise<GetItemsResult<T>>;

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
  getMeta<const K extends StorageItemKey>(
    key: K,
  ): Promise<Record<string, unknown>>;

  /**
   * Get the metadata of multiple storage items.
   *
   * @param keys List of keys or items to get the metadata of.
   * @returns An array containing storage keys and their metadata.
   */
  getMetas<const T extends ReadonlyArray<GetMetasInputElement>>(
    keys: T,
  ): Promise<GetMetasResult<T>>;

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
  setItem<const K extends StorageItemKey>(
    key: K,
    value: unknown,
  ): Promise<void>;

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
      | {
          item: WxtStorageItem<any, any, any, any, any, any, any>;
          value: unknown;
        }
    >,
  ): Promise<void>;

  /**
   * Sets metadata properties. If some properties are already set, but are not
   * included in the `properties` parameter, they will not be removed.
   *
   * @example
   *   await storage.setMeta('local:installDate', { appVersion });
   */
  setMeta<const K extends StorageItemKey>(
    key: K,
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
      | {
          item: WxtStorageItem<any, any, any, any, any, any, any>;
          meta: Record<string, unknown>;
        }
    >,
  ): Promise<void>;

  /**
   * Removes an item from storage.
   *
   * @example
   *   await storage.removeItem('local:installDate');
   */
  removeItem<const K extends StorageItemKey>(
    key: K,
    opts?: RemoveItemOptions,
  ): Promise<void>;

  /** Remove a list of keys from storage. */
  removeItems(
    keys: Array<
      | StorageItemKey
      | WxtStorageItem<any, any, any, any, any, any, any>
      | { key: StorageItemKey; options?: RemoveItemOptions }
      | {
          item: WxtStorageItem<any, any, any, any, any, any, any>;
          options?: RemoveItemOptions;
        }
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
  removeMeta<const K extends StorageItemKey>(
    key: K,
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
  watch<const K extends StorageItemKey>(
    key: K,
    cb: WatchCallback<unknown>,
  ): Unwatch;

  /** Remove all watch listeners. */
  unwatch(): void;

  /**
   * Define a storage item with a default value, type, or versioning.
   *
   * Read full docs: https://wxt.dev/storage.html#defining-storage-items
   */
  // bare — no options, no schema. All narrow slots default to their
  // no-op literals: TFallback=null, TVersion=number, TDebug=false,
  // TValidationError='throw', TSchema=undefined.
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
  >(
    key: TKey,
  ): Prettify<
    WxtStorageItem<
      TValue | null,
      TMetadata,
      TKey,
      null,
      number,
      false,
      undefined
    >
  >;
  // --- schema-carrying overloads ---
  // Each captures via `<const>`:
  //   TFallback — fallback/defaultValue literal (with intersection guard against schema output)
  //   TVersion  — numeric literal, length-locks migrations tuple
  //   TDebug    — boolean literal (true/false, defaults to false)
  //   TValidationError — 'throw'|'fallback'|'reset' literal OR callback identity
  //   TSchema   — the schema itself is captured as its exact type
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
    const TFallback = StandardSchemaV1.InferOutput<TSchema>,
    const TVersion extends number = number,
    const TMigrations extends MigrationTuple<TVersion> =
      MigrationTuple<TVersion>,
    const TDebug extends boolean = false,
  >(
    key: TKey,
    options: Omit<
      WxtStorageItemOptions<
        StandardSchemaV1.InferOutput<TSchema>,
        TRaw,
        TVersion
      >,
      'migrations'
    > & {
      migrations?: TMigrations;
      schema: TSchema;
      fallback: TFallback & DeepReadonly<StandardSchemaV1.InferOutput<TSchema>>;
      debug?: TDebug;
    },
  ): Prettify<
    WxtStorageItem<
      StandardSchemaV1.InferOutput<TSchema>,
      TMetadata,
      TKey,
      TFallback,
      TVersion,
      TDebug,
      TSchema
    >
  >;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
    const TFallback = StandardSchemaV1.InferOutput<TSchema>,
    const TVersion extends number = number,
    const TMigrations extends MigrationTuple<TVersion> =
      MigrationTuple<TVersion>,
    const TDebug extends boolean = false,
  >(
    key: TKey,
    options: Omit<
      WxtStorageItemOptions<
        StandardSchemaV1.InferOutput<TSchema>,
        TRaw,
        TVersion
      >,
      'migrations'
    > & {
      migrations?: TMigrations;
      schema: TSchema;
      defaultValue: TFallback &
        DeepReadonly<StandardSchemaV1.InferOutput<TSchema>>;
      debug?: TDebug;
    },
  ): Prettify<
    WxtStorageItem<
      StandardSchemaV1.InferOutput<TSchema>,
      TMetadata,
      TKey,
      TFallback,
      TVersion,
      TDebug,
      TSchema
    >
  >;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
    const TVersion extends number = number,
    const TMigrations extends MigrationTuple<TVersion> =
      MigrationTuple<TVersion>,
    const TDebug extends boolean = false,
  >(
    key: TKey,
    options: Omit<
      WxtStorageItemOptions<
        StandardSchemaV1.InferOutput<TSchema>,
        TRaw,
        TVersion
      >,
      'migrations'
    > & {
      migrations?: TMigrations;
      schema: TSchema;
      init: () =>
        | StandardSchemaV1.InferOutput<TSchema>
        | Promise<StandardSchemaV1.InferOutput<TSchema>>;
      debug?: TDebug;
    },
  ): Prettify<
    WxtStorageItem<
      StandardSchemaV1.InferOutput<TSchema>,
      TMetadata,
      TKey,
      null,
      TVersion,
      TDebug,
      TSchema
    >
  >;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
    const TVersion extends number = number,
    const TMigrations extends MigrationTuple<TVersion> =
      MigrationTuple<TVersion>,
    const TDebug extends boolean = false,
  >(
    key: TKey,
    options: Omit<
      WxtStorageItemOptions<
        StandardSchemaV1.InferOutput<TSchema>,
        TRaw,
        TVersion
      >,
      'migrations'
    > & {
      migrations?: TMigrations;
      schema: TSchema;
      debug?: TDebug;
    },
  ): Prettify<
    WxtStorageItem<
      StandardSchemaV1.InferOutput<TSchema> | null,
      TMetadata,
      TKey,
      null,
      TVersion,
      TDebug,
      TSchema
    >
  >;
  // Non-schema overloads.
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
    const TFallback = Widen<TValue>,
    const TVersion extends number = number,
    const TMigrations extends MigrationTuple<TVersion> =
      MigrationTuple<TVersion>,
    const TDebug extends boolean = false,
  >(
    key: TKey,
    options: Omit<
      WxtStorageItemOptions<TValue, TRaw, TVersion>,
      'migrations'
    > & {
      migrations?: TMigrations;
      fallback: TFallback & DeepReadonly<TValue>;
      debug?: TDebug;
    },
  ): Prettify<
    WxtStorageItem<
      Widen<TValue>,
      TMetadata,
      TKey,
      TFallback,
      TVersion,
      TDebug,
      undefined
    >
  >;
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
    const TFallback = Widen<TValue>,
    const TVersion extends number = number,
    const TMigrations extends MigrationTuple<TVersion> =
      MigrationTuple<TVersion>,
    const TDebug extends boolean = false,
  >(
    key: TKey,
    options: Omit<
      WxtStorageItemOptions<TValue, TRaw, TVersion>,
      'migrations'
    > & {
      migrations?: TMigrations;
      defaultValue: TFallback & DeepReadonly<TValue>;
      debug?: TDebug;
    },
  ): Prettify<
    WxtStorageItem<
      Widen<TValue>,
      TMetadata,
      TKey,
      TFallback,
      TVersion,
      TDebug,
      undefined
    >
  >;
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
    const TVersion extends number = number,
    const TMigrations extends MigrationTuple<TVersion> =
      MigrationTuple<TVersion>,
    const TDebug extends boolean = false,
  >(
    key: TKey,
    options: Omit<
      WxtStorageItemOptions<TValue, TRaw, TVersion>,
      'migrations'
    > & {
      migrations?: TMigrations;
      init: () => TValue | Promise<TValue>;
      debug?: TDebug;
    },
  ): Prettify<
    WxtStorageItem<
      Widen<TValue>,
      TMetadata,
      TKey,
      null,
      TVersion,
      TDebug,
      undefined
    >
  >;
  defineItem<
    TValue,
    TMetadata extends Record<string, unknown> = {},
    const TKey extends StorageItemKey = StorageItemKey,
    TRaw = unknown,
    const TVersion extends number = number,
    const TMigrations extends MigrationTuple<TVersion> =
      MigrationTuple<TVersion>,
    const TDebug extends boolean = false,
  >(
    key: TKey,
    options: Omit<
      WxtStorageItemOptions<TValue, TRaw, TVersion>,
      'migrations'
    > & {
      migrations?: TMigrations;
      debug?: TDebug;
    },
  ): Prettify<
    WxtStorageItem<
      Widen<TValue> | null,
      TMetadata,
      TKey,
      null,
      TVersion,
      TDebug,
      undefined
    >
  >;
}

/**
 * Common surface of every driver — reads and observation. Available on both
 * mutable areas (`local`/`sync`/`session`) and the read-only `managed` area.
 */
interface BaseStorageDriver<TArea extends StorageArea> {
  /**
   * The `chrome.storage.*` area this driver wraps. Preserved as a literal via
   * `<const TArea>` on `createDriver`, so a driver returned by
   * `createDriver('local')` is typed with area `'local'` — distinct from
   * `'managed'` at compile time even when method surfaces overlap. Callers that
   * want per-area guarantees can narrow via this brand.
   *
   * `TArea` sits in an output-position (`readonly area`), so it's covariant: a
   * narrow driver assigns to a wide `<StorageArea>` slot (widening is allowed
   * at read sites).
   */
  readonly area: TArea;
  getItem(key: string): Promise<unknown>;
  getItems(
    keys: readonly string[],
  ): Promise<Array<{ key: string; value: unknown }>>;
  snapshot(): Promise<Record<string, unknown>>;
  watch(key: string, cb: WatchCallback<unknown>): Unwatch;
  unwatch(): void;
}

/**
 * Adds the write methods on top of {@link BaseStorageDriver}. Only mutable areas
 * (`local` | `sync` | `session`) satisfy this shape.
 */
interface MutableStorageDriver<
  TArea extends StorageArea,
> extends BaseStorageDriver<TArea> {
  setItem(key: string, value: unknown): Promise<void>;
  setItems(
    values: ReadonlyArray<{ key: string; value: unknown }>,
  ): Promise<void>;
  removeItem(key: string): Promise<void>;
  removeItems(keys: readonly string[]): Promise<void>;
  clear(): Promise<void>;
  restoreSnapshot(data: Record<string, unknown>): Promise<void>;
}

/**
 * `browser.storage.managed` is read-only — write attempts throw at runtime
 * (extensions can only READ managed policy set by admins). This alias makes
 * that invariant type-visible: structurally identical to
 * {@link BaseStorageDriver}, no mutation methods present.
 */
type ReadonlyStorageDriver<TArea extends StorageArea> =
  BaseStorageDriver<TArea>;

/**
 * Public driver type, keyed by area. Distributing conditional:
 *
 * WxtStorageDriver<'managed'> → ReadonlyStorageDriver<'managed'>
 * WxtStorageDriver<'local'> → MutableStorageDriver<'local'>
 * WxtStorageDriver<StorageArea> distributes to
 * ReadonlyStorageDriver<'managed'>
 *
 * | MutableStorageDriver<'local' | 'sync' | 'session'>
 *
 * So `WxtStorageDriver<'managed'>.setItem` is a compile-time error — the
 * "managed is read-only" invariant is moved from runtime docs into the type
 * system.
 *
 * The wide default `WxtStorageDriver<StorageArea>` is a distributed union, so
 * only common (read) methods survive without narrowing. Internal callers with
 * wide area must runtime-narrow via {@link assertMutable} before writing.
 */
type WxtStorageDriver<TArea extends StorageArea = StorageArea> =
  TArea extends 'managed'
    ? ReadonlyStorageDriver<TArea>
    : MutableStorageDriver<TArea>;

export interface WxtStorageItem<
  TValue,
  TMetadata extends Record<string, unknown>,
  TKey extends StorageItemKey = StorageItemKey,
  TFallback = null,
  TVersion extends number = number,
  TDebug extends boolean = false,
  TSchema = undefined,
> {
  /**
   * The storage key passed to `defineItem`. String-literal keys narrow to that
   * literal; wider `StorageItemKey` values stay as the union.
   */
  key: TKey;

  /**
   * The storage area, derived at the type level from the key prefix
   * (`'local:x'` → `'local'`). Runtime value mirrors `driver.area`.
   */
  readonly area: TKey extends `${infer A extends StorageArea}:${string}`
    ? A
    : StorageArea;

  /** The schema version, captured as a numeric literal when passed directly. */
  readonly version: TVersion;

  /** The `debug` flag as captured at define-time. */
  readonly debug: TDebug;

  /** The `onValidationError` policy in effect at read-time. */
  readonly onValidationError: OnValidationError<TValue>;

  /** The schema passed at define-time, or `undefined`. */
  readonly schema: TSchema;

  /** @deprecated Renamed to fallback, use it instead. */
  defaultValue: TFallback;

  /**
   * The `fallback` option value, preserved as its literal type where possible
   * (`fallback: 'system' as const` → typed `'system'`).
   */
  fallback: TFallback;

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

/**
 * Chain-checked migrations for `WxtStorageItemOptions.migrations`.
 *
 * Returns a curried function whose overloads validate that each migration's
 * return type matches the next migration's parameter type, and that the last
 * migration's return type matches `TValue`.
 *
 * At runtime, this is an identity wrapper — it returns the migrations array
 * unchanged. All the work is at the type level.
 *
 * @example
 *   ```ts
 *   storage.defineItem('local:count', {
 *   version: 3,
 *   fallback: 0,
 *   migrations: defineMigrations<number>()(
 *   (v) => Number(v) * 2,   // v1 → v2 (unknown → number)
 *   (v) => v + 10,          // v2 → v3 (number → number, must match TValue)
 *   ),
 *   });
 *   ```;
 */
export function defineMigrations<TValue>(): {
  (): readonly [];
  <A extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
  ): readonly [(v: unknown) => A | Promise<A>];
  <A, B extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
  ): readonly [(v: unknown) => A | Promise<A>, (v: A) => B | Promise<B>];
  <A, B, C extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
    f3: (v: B) => C | Promise<C>,
  ): readonly [
    (v: unknown) => A | Promise<A>,
    (v: A) => B | Promise<B>,
    (v: B) => C | Promise<C>,
  ];
  <A, B, C, D extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
    f3: (v: B) => C | Promise<C>,
    f4: (v: C) => D | Promise<D>,
  ): readonly [
    (v: unknown) => A | Promise<A>,
    (v: A) => B | Promise<B>,
    (v: B) => C | Promise<C>,
    (v: C) => D | Promise<D>,
  ];
  <A, B, C, D, E extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
    f3: (v: B) => C | Promise<C>,
    f4: (v: C) => D | Promise<D>,
    f5: (v: D) => E | Promise<E>,
  ): readonly [
    (v: unknown) => A | Promise<A>,
    (v: A) => B | Promise<B>,
    (v: B) => C | Promise<C>,
    (v: C) => D | Promise<D>,
    (v: D) => E | Promise<E>,
  ];
  <A, B, C, D, E, F extends TValue>(
    f1: (v: unknown) => A | Promise<A>,
    f2: (v: A) => B | Promise<B>,
    f3: (v: B) => C | Promise<C>,
    f4: (v: C) => D | Promise<D>,
    f5: (v: D) => E | Promise<E>,
    f6: (v: E) => F | Promise<F>,
  ): readonly [
    (v: unknown) => A | Promise<A>,
    (v: A) => B | Promise<B>,
    (v: B) => C | Promise<C>,
    (v: C) => D | Promise<D>,
    (v: D) => E | Promise<E>,
    (v: E) => F | Promise<F>,
  ];
  // Beyond 6 versions, fall back to the untyped array shape.
  (
    ...fns: ReadonlyArray<(v: unknown) => unknown | Promise<unknown>>
  ): ReadonlyArray<(v: unknown) => unknown | Promise<unknown>>;
} {
  return ((...fns: ReadonlyArray<(v: unknown) => unknown>) =>
    fns) as ReturnType<typeof defineMigrations<TValue>>;
}

export class MigrationError extends Error {
  constructor(key: string, version: number, options?: ErrorOptions) {
    super(`v${version} migration failed for "${key}"`, options);
  }
}
