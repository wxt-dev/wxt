/**
 * Simplified storage APIs with support for versioned fields, snapshots,
 * metadata, and item definitions.
 *
 * See [the guide](https://wxt.dev/storage.html) for more information.
 *
 * @module @wxt-dev/storage
 */
import { browser, type Browser } from '@wxt-dev/browser';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { SchemaError } from '@standard-schema/utils';
import { Mutex } from 'async-mutex';
import { dequal } from 'dequal/lite';

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

  const resolveKey = (key: StorageItemKey) => {
    const deliminatorIndex = key.indexOf(':');
    const driverArea = key.substring(0, deliminatorIndex) as StorageArea;

    const driverKey = key.substring(deliminatorIndex + 1);
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

  const getMetaKey = (key: string) => key + '$';

  const mergeMeta = (oldMeta: any, newMeta: any): any => {
    const newFields = { ...oldMeta };

    Object.entries(newMeta).forEach(([key, value]) => {
      if (value == null) delete newFields[key];
      else newFields[key] = value;
    });

    return newFields;
  };

  const getValueOrFallback = (value: any, fallback: any) =>
    value ?? fallback ?? null;

  const getMetaValue = (properties: any) =>
    typeof properties === 'object' && !Array.isArray(properties)
      ? properties
      : {};

  const getItem = async (
    driver: WxtStorageDriver,
    driverKey: string,
    opts: GetItemOptions<any> | undefined,
  ) => {
    const res = await driver.getItem<any>(driverKey);
    return getValueOrFallback(res, opts?.fallback ?? opts?.defaultValue);
  };

  const getMeta = async (driver: WxtStorageDriver, driverKey: string) => {
    const metaKey = getMetaKey(driverKey);
    const res = await driver.getItem<any>(metaKey);
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
    value: any,
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
    properties: any | undefined,
  ) => {
    const metaKey = getMetaKey(driverKey);
    const existingFields = getMetaValue(await driver.getItem(metaKey));
    await driver.setItem(metaKey, mergeMeta(existingFields, properties));
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

  const watch = (
    driver: WxtStorageDriver,
    driverKey: string,
    cb: WatchCallback<any>,
  ) => driver.watch(driverKey, cb);

  return {
    getItem: async (key, opts) => {
      const { driver, driverKey } = resolveKey(key);
      return await getItem(driver, driverKey, opts);
    },

    getItems: async (keys) => {
      const areaToKeyMap = new Map<StorageArea, string[]>();
      const keyToOptsMap = new Map<string, GetItemOptions<any> | undefined>();
      const orderedKeys: StorageItemKey[] = [];

      keys.forEach((key) => {
        let keyStr: StorageItemKey;
        let opts: GetItemOptions<any> | undefined;

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

      const resultsMap = new Map<StorageItemKey, any>();
      await Promise.all(
        Array.from(areaToKeyMap.entries()).map(async ([driverArea, keys]) => {
          const driverResults = await drivers[driverArea].getItems(keys);

          driverResults.forEach((driverResult) => {
            const key = `${driverArea}:${driverResult.key}` as StorageItemKey;
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

      const resultsMap: Record<string, any> = {};
      await Promise.all(
        Object.entries(areaToDriverMetaKeysMap).map(async ([area, keys]) => {
          const areaRes = await browser.storage[area as StorageArea].get(
            keys.map((key) => key.driverMetaKey),
          );
          keys.forEach((key) => {
            resultsMap[key.key] = areaRes[key.driverMetaKey] ?? {};
          });
        }),
      );

      return keys.map((key) => ({
        key: key.key,
        meta: resultsMap[key.key],
      }));
    },

    setItem: async (key, value) => {
      const { driver, driverKey } = resolveKey(key);
      await setItem(driver, driverKey, value);
    },

    setItems: async (items) => {
      const areaToKeyValueMap: Partial<
        Record<StorageArea, Array<{ key: string; value: any }>>
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
        Object.entries(areaToKeyValueMap).map(async ([driverArea, values]) => {
          const driver = getDriver(driverArea as StorageArea);
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
        Record<StorageArea, { key: string; properties: any }[]>
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
        Object.entries(areaToMetaUpdatesMap).map(
          async ([storageArea, updates]) => {
            const driver = getDriver(storageArea as StorageArea);
            const metaKeys = updates.map(({ key }) => getMetaKey(key));
            const existingMetas = await driver.getItems(metaKeys);
            const existingMetaMap = Object.fromEntries(
              existingMetas.map(({ key, value }) => [key, getMetaValue(value)]),
            );

            const metaUpdates = updates.map(({ key, properties }) => {
              const metaKey = getMetaKey(key);
              return {
                key: metaKey,
                value: mergeMeta(existingMetaMap[metaKey] ?? {}, properties),
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
        Object.entries(areaToKeysMap).map(async ([driverArea, keys]) => {
          const driver = getDriver(driverArea as StorageArea);
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
        const [{ value }, { value: meta }] = await driver.getItems([
          driverKey,
          driverMetaKey,
        ]);

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
          const raw = await driver.getItem<any>(driverKey);

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
          await driver.setItem<any>(driverKey, rawToStore);
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
    getItem: async (key) => {
      const res = await getStorageArea().get<Record<string, any>>(key);
      return res[key];
    },

    getItems: async (keys) => {
      const result = await getStorageArea().get(keys);
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
      await getStorageArea().remove(keys);
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

    watch(key, cb) {
      const listener = (changes: StorageAreaChanges) => {
        const change = changes[key] as {
          newValue?: any;
          oldValue?: any | null;
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
  getItem<TValue>(
    key: StorageItemKey,
    opts: GetItemOptions<TValue> & { fallback: TValue },
  ): Promise<TValue>;

  getItem<TValue>(
    key: StorageItemKey,
    opts?: GetItemOptions<TValue>,
  ): Promise<TValue | null>;

  /**
   * Get multiple items from storage. The return order is guaranteed to be the
   * same as the order requested.
   *
   * @example
   *   await storage.getItems(['local:installDate', 'session:someCounter']);
   */
  getItems(
    keys: Array<
      | StorageItemKey
      | WxtStorageItem<any, any>
      | { key: StorageItemKey; options?: GetItemOptions<any> }
    >,
  ): Promise<Array<{ key: StorageItemKey; value: any }>>;

  /**
   * Return an object containing metadata about the key. Object is stored at
   * `key + "$"`. If value is not an object, it returns an empty object.
   *
   * @example
   *   await storage.getMeta('local:installDate');
   */
  getMeta<T extends Record<string, unknown>>(key: StorageItemKey): Promise<T>;

  /**
   * Get the metadata of multiple storage items.
   *
   * @param keys List of keys or items to get the metadata of.
   * @returns An array containing storage keys and their metadata.
   */
  getMetas(
    keys: Array<StorageItemKey | WxtStorageItem<any, any>>,
  ): Promise<Array<{ key: StorageItemKey; meta: any }>>;

  /**
   * Set a value in storage. Setting a value to `null` or `undefined` is
   * equivalent to calling `removeItem`.
   *
   * @example
   *   await storage.setItem<number>('local:installDate', Date.now());
   */
  setItem<T>(key: StorageItemKey, value: T | null): Promise<void>;

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
    values: Array<
      | { key: StorageItemKey; value: any }
      | { item: WxtStorageItem<any, any>; value: any }
    >,
  ): Promise<void>;

  /**
   * Sets metadata properties. If some properties are already set, but are not
   * included in the `properties` parameter, they will not be removed.
   *
   * @example
   *   await storage.setMeta('local:installDate', { appVersion });
   */
  setMeta<T extends Record<string, unknown>>(
    key: StorageItemKey,
    properties: T | null,
  ): Promise<void>;

  /**
   * Set the metadata of multiple storage items.
   *
   * @param metas List of storage keys or items and metadata to set for each.
   */
  setMetas(
    metas: Array<
      | { key: StorageItemKey; meta: Record<string, any> }
      | { item: WxtStorageItem<any, any>; meta: Record<string, any> }
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
  restoreSnapshot(base: StorageArea, data: any): Promise<void>;

  /** Watch for changes to a specific key in storage. */
  watch<T>(key: StorageItemKey, cb: WatchCallback<T | null>): Unwatch;

  /** Remove all watch listeners. */
  unwatch(): void;

  /**
   * Define a storage item with a default value, type, or versioning.
   *
   * Read full docs: https://wxt.dev/storage.html#defining-storage-items
   */
  defineItem<TValue, TMetadata extends Record<string, unknown> = {}>(
    key: StorageItemKey,
  ): WxtStorageItem<TValue | null, TMetadata>;
  // --- schema-carrying overloads ---
  // These sit above the plain overloads so TypeScript picks them up whenever
  // `schema` is present, driving TValue from the schema's output type.
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
  >(
    key: StorageItemKey,
    options: WxtStorageItemOptions<StandardSchemaV1.InferOutput<TSchema>> & {
      schema: TSchema;
      fallback: StandardSchemaV1.InferOutput<TSchema>;
    },
  ): WxtStorageItem<StandardSchemaV1.InferOutput<TSchema>, TMetadata>;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
  >(
    key: StorageItemKey,
    options: WxtStorageItemOptions<StandardSchemaV1.InferOutput<TSchema>> & {
      schema: TSchema;
      defaultValue: StandardSchemaV1.InferOutput<TSchema>;
    },
  ): WxtStorageItem<StandardSchemaV1.InferOutput<TSchema>, TMetadata>;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
  >(
    key: StorageItemKey,
    options: WxtStorageItemOptions<StandardSchemaV1.InferOutput<TSchema>> & {
      schema: TSchema;
      init: () =>
        | StandardSchemaV1.InferOutput<TSchema>
        | Promise<StandardSchemaV1.InferOutput<TSchema>>;
    },
  ): WxtStorageItem<StandardSchemaV1.InferOutput<TSchema>, TMetadata>;
  defineItem<
    TSchema extends StandardSchemaV1<unknown, unknown>,
    TMetadata extends Record<string, unknown> = {},
  >(
    key: StorageItemKey,
    options: WxtStorageItemOptions<StandardSchemaV1.InferOutput<TSchema>> & {
      schema: TSchema;
    },
  ): WxtStorageItem<StandardSchemaV1.InferOutput<TSchema> | null, TMetadata>;
  // --- non-schema overloads (unchanged) ---
  defineItem<TValue, TMetadata extends Record<string, unknown> = {}>(
    key: StorageItemKey,
    options: WxtStorageItemOptions<TValue> & { fallback: TValue },
  ): WxtStorageItem<TValue, TMetadata>;
  defineItem<TValue, TMetadata extends Record<string, unknown> = {}>(
    key: StorageItemKey,
    options: WxtStorageItemOptions<TValue> & { defaultValue: TValue },
  ): WxtStorageItem<TValue, TMetadata>;
  defineItem<TValue, TMetadata extends Record<string, unknown> = {}>(
    key: StorageItemKey,
    options: WxtStorageItemOptions<TValue> & {
      init: () => TValue | Promise<TValue>;
    },
  ): WxtStorageItem<TValue, TMetadata>;
  defineItem<TValue, TMetadata extends Record<string, unknown> = {}>(
    key: StorageItemKey,
    options: WxtStorageItemOptions<TValue>,
  ): WxtStorageItem<TValue | null, TMetadata>;
}

interface WxtStorageDriver {
  getItem<T>(key: string): Promise<T | null>;
  getItems(keys: string[]): Promise<{ key: string; value: any }[]>;
  setItem<T>(key: string, value: T | null): Promise<void>;
  setItems(values: Array<{ key: string; value: any }>): Promise<void>;
  removeItem(key: string): Promise<void>;
  removeItems(keys: string[]): Promise<void>;
  clear(): Promise<void>;
  snapshot(): Promise<Record<string, unknown>>;
  restoreSnapshot(data: Record<string, unknown>): Promise<void>;
  watch<T>(key: string, cb: WatchCallback<T | null>): Unwatch;
  unwatch(): void;
}

export interface WxtStorageItem<
  TValue,
  TMetadata extends Record<string, unknown>,
> {
  /** The storage key passed when creating the storage item. */
  key: StorageItemKey;

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

export type StorageArea = 'local' | 'session' | 'sync' | 'managed';
export type StorageItemKey = `${StorageArea}:${string}`;

export interface GetItemOptions<T> {
  /** @deprecated Renamed to `fallback`, use it instead. */
  defaultValue?: T;

  /** Default value returned when `getItem` would otherwise return `null`. */
  fallback?: T;
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
  excludeKeys?: string[];
}

export interface WxtStorageItemOptions<T> {
  /** @deprecated Renamed to `fallback`, use it instead. */
  defaultValue?: T;

  /** Default value returned when `getValue` would otherwise return `null`. */
  fallback?: T;

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
   * @example
   *   ```ts
   *   // Storing a Set: serializer required (Sets aren't JSON-serializable).
   *   storage.defineItem<Set<string>>('local:enabled-sites', {
   *   serializer: {
   *   write: (set) => [...set],
   *   read: (arr) => new Set(arr as string[]),
   *   },
   *   });
   *
   *   // Storing a Date with a coerce schema: only `write` needed.
   *   storage.defineItem('local:install-date', {
   *   serializer: { write: (d) => d.toISOString() },
   *   schema: z.coerce.date(),
   *   });
   *   ```
   */
  serializer?: WxtStorageItemSerializer<T>;

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

export type StorageAreaChanges = {
  [key: string]: Browser.storage.StorageChange;
};

/**
 * Same as `Partial`, but includes `| null`. It makes all the properties of an
 * object optional and nullable.
 */
type NullablePartial<T> = {
  [key in keyof T]+?: T[key] | undefined | null;
};

/** Callback called when a value in storage is changed. */
export type WatchCallback<T> = (newValue: T, oldValue: T) => void;

/** Call to remove a watch listener */
export type Unwatch = () => void;

export class MigrationError extends Error {
  constructor(
    public key: string,
    public version: number,
    options?: ErrorOptions,
  ) {
    super(`v${version} migration failed for "${key}"`, options);
  }
}
