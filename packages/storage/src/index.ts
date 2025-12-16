/**
 * Simplified storage APIs with support for versioned fields, snapshots, metadata, and item definitions.
 *
 * See [the guide](https://wxt.dev/storage.html) for more information.
 * @module @wxt-dev/storage
 */
import { dequal } from 'dequal/lite';
import { Mutex } from 'async-mutex';
import { browser, type Browser } from '@wxt-dev/browser';

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
    if (driverKey == null)
      throw Error(
        `Storage key should be in the form of "area:key", but received "${key}"`,
      );

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
  const setItem = async (
    driver: WxtStorageDriver,
    driverKey: string,
    value: any,
  ) => {
    await driver.setItem(driverKey, value ?? null);
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
  ) => {
    return driver.watch(driverKey, cb);
  };

  const storage: WxtStorage = {
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
    defineItem: (key, opts?: WxtStorageItemOptions<any>) => {
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
      const migrate = async () => {
        const driverMetaKey = getMetaKey(driverKey);
        const [{ value }, { value: meta }] = await driver.getItems([
          driverKey,
          driverMetaKey,
        ]);
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

        if (debug === true) {
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
            if (debug === true) {
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

        if (debug === true) {
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
          const value = await driver.getItem<any>(driverKey);
          if (value == null && targetVersion > 1)
            await setMeta(driver, driverKey, { v: targetVersion });

          // Don't init value if it already exists or the init function isn't provided
          if (value != null || opts?.init == null) return value;

          const newValue = await opts.init();
          await driver.setItem<any>(driverKey, newValue);
          return newValue;
        });

      // Initialize the value once migrations have finished
      migrationsDone.then(getOrInitValue);

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
          } else {
            return await getItem(driver, driverKey, opts);
          }
        },
        getMeta: async () => {
          await migrationsDone;
          return await getMeta(driver, driverKey);
        },
        setValue: async (value) => {
          await migrationsDone;
          return await setItem(driver, driverKey, value);
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
          watch(driver, driverKey, (newValue, oldValue) =>
            cb(newValue ?? getFallback(), oldValue ?? getFallback()),
          ),
        migrate,
      };
    },
  };
  return storage;
}

function createDriver(storageArea: StorageArea): WxtStorageDriver {
  const getStorageArea = () => {
    if (browser.runtime == null) {
      throw Error(
        [
          "'wxt/storage' must be loaded in a web extension environment",
          '\n - If thrown during a build, see https://github.com/wxt-dev/wxt/issues/371',
          " - If thrown during tests, mock 'wxt/browser' correctly. See https://wxt.dev/guide/go-further/testing.html\n",
        ].join('\n'),
      );
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
        if (change == null) return;
        if (dequal(change.newValue, change.oldValue)) return;
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
   * await storage.getItem<number>("local:installDate");
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
   * Get multiple items from storage. The return order is guaranteed to be the same as the order
   * requested.
   *
   * @example
   * await storage.getItems(["local:installDate", "session:someCounter"]);
   */
  getItems(
    keys: Array<
      | StorageItemKey
      | WxtStorageItem<any, any>
      | { key: StorageItemKey; options?: GetItemOptions<any> }
    >,
  ): Promise<Array<{ key: StorageItemKey; value: any }>>;
  /**
   * Return an object containing metadata about the key. Object is stored at `key + "$"`. If value
   * is not an object, it returns an empty object.
   *
   * @example
   * await storage.getMeta("local:installDate");
   */
  getMeta<T extends Record<string, unknown>>(key: StorageItemKey): Promise<T>;
  /**
   * Get the metadata of multiple storage items.
   *
   * @param items List of keys or items to get the metadata of.
   * @returns An array containing storage keys and their metadata.
   */
  getMetas(
    keys: Array<StorageItemKey | WxtStorageItem<any, any>>,
  ): Promise<Array<{ key: StorageItemKey; meta: any }>>;
  /**
   * Set a value in storage. Setting a value to `null` or `undefined` is equivalent to calling
   * `removeItem`.
   *
   * @example
   * await storage.setItem<number>("local:installDate", Date.now());
   */
  setItem<T>(key: StorageItemKey, value: T | null): Promise<void>;
  /**
   * Set multiple values in storage. If a value is set to `null` or `undefined`, the key is removed.
   *
   * @example
   * await storage.setItem([
   *   { key: "local:installDate", value: Date.now() },
   *   { key: "session:someCounter, value: 5 },
   * ]);
   */
  setItems(
    values: Array<
      | { key: StorageItemKey; value: any }
      | { item: WxtStorageItem<any, any>; value: any }
    >,
  ): Promise<void>;
  /**
   * Sets metadata properties. If some properties are already set, but are not included in the
   * `properties` parameter, they will not be removed.
   *
   * @example
   * await storage.setMeta("local:installDate", { appVersion });
   */
  setMeta<T extends Record<string, unknown>>(
    key: StorageItemKey,
    properties: T | null,
  ): Promise<void>;
  /**
   * Set the metadata of multiple storage items.
   *
   * @param items List of storage keys or items and metadata to set for each.
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
   * await storage.removeItem("local:installDate");
   */
  removeItem(key: StorageItemKey, opts?: RemoveItemOptions): Promise<void>;
  /**
   * Remove a list of keys from storage.
   */
  removeItems(
    keys: Array<
      | StorageItemKey
      | WxtStorageItem<any, any>
      | { key: StorageItemKey; options?: RemoveItemOptions }
      | { item: WxtStorageItem<any, any>; options?: RemoveItemOptions }
    >,
  ): Promise<void>;

  /**
   * Removes all items from the provided storage area.
   */
  clear(base: StorageArea): Promise<void>;

  /**
   * Remove the entire metadata for a key, or specific properties by name.
   *
   * @example
   * // Remove all metadata properties from the item
   * await storage.removeMeta("local:installDate");
   *
   * // Remove only specific the "v" field
   * await storage.removeMeta("local:installDate", "v")
   */
  removeMeta(
    key: StorageItemKey,
    properties?: string | string[],
  ): Promise<void>;
  /**
   * Return all the items in storage.
   */
  snapshot(
    base: StorageArea,
    opts?: SnapshotOptions,
  ): Promise<Record<string, unknown>>;
  /**
   * Restores the results of `snapshot`. If new properties have been saved since the snapshot, they are
   * not overridden. Only values existing in the snapshot are overridden.
   */
  restoreSnapshot(base: StorageArea, data: any): Promise<void>;
  /**
   * Watch for changes to a specific key in storage.
   */
  watch<T>(key: StorageItemKey, cb: WatchCallback<T | null>): Unwatch;
  /**
   * Remove all watch listeners.
   */
  unwatch(): void;

  /**
   * Define a storage item with a default value, type, or versioning.
   *
   * Read full docs: https://wxt.dev/storage.html#defining-storage-items
   */
  defineItem<TValue, TMetadata extends Record<string, unknown> = {}>(
    key: StorageItemKey,
  ): WxtStorageItem<TValue | null, TMetadata>;
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
  /**
   * The storage key passed when creating the storage item.
   */
  key: StorageItemKey;
  /**
   * @deprecated Renamed to fallback, use it instead.
   */
  defaultValue: TValue;
  /**
   * The value provided by the `fallback` option.
   */
  fallback: TValue;
  /**
   * Get the latest value from storage.
   */
  getValue(): Promise<TValue>;
  /**
   * Get metadata.
   */
  getMeta(): Promise<NullablePartial<TMetadata>>;
  /**
   * Set the value in storage.
   */
  setValue(value: TValue): Promise<void>;
  /**
   * Set metadata properties.
   */
  setMeta(properties: NullablePartial<TMetadata>): Promise<void>;
  /**
   * Remove the value from storage.
   */
  removeValue(opts?: RemoveItemOptions): Promise<void>;
  /**
   * Remove all metadata or certain properties from metadata.
   */
  removeMeta(properties?: string[]): Promise<void>;
  /**
   * Listen for changes to the value in storage.
   */
  watch(cb: WatchCallback<TValue>): Unwatch;
  /**
   * If there are migrations defined on the storage item, migrate to the latest version.
   *
   * **This function is ran automatically whenever the extension updates**, so you don't have to call it
   * manually.
   */
  migrate(): Promise<void>;
}

export type StorageArea = 'local' | 'session' | 'sync' | 'managed';
export type StorageItemKey = `${StorageArea}:${string}`;

export interface GetItemOptions<T> {
  /**
   * @deprecated Renamed to `fallback`, use it instead.
   */
  defaultValue?: T;
  /**
   * Default value returned when `getItem` would otherwise return `null`.
   */
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
   * Exclude a list of keys. The storage area prefix should be removed since the snapshot is for a
   * specific storage area already.
   */
  excludeKeys?: string[];
}

export interface WxtStorageItemOptions<T> {
  /**
   * @deprecated Renamed to `fallback`, use it instead.
   */
  defaultValue?: T;
  /**
   * Default value returned when `getValue` would otherwise return `null`.
   */
  fallback?: T;
  /**
   * If passed, a value in storage will be initialized immediately after
   * defining the storage item. This function returns the value that will be
   * saved to storage during the initialization process if a value doesn't
   * already exist.
   */
  init?: () => T | Promise<T>;
  /**
   * Provide a version number for the storage item to enable migrations. When changing the version
   * in the future, migration functions will be ran on application startup.
   */
  version?: number;
  /**
   * A map of version numbers to the functions used to migrate the data to that version.
   */
  migrations?: Record<number, (oldValue: any) => any>;
  /**
   * Print debug logs, such as migration process.
   * @default false
   */
  debug?: boolean;
  /**
   * A callback function that runs on migration complete.
   */
  onMigrationComplete?: (migratedValue: T, targetVersion: number) => void;
}

export type StorageAreaChanges = {
  [key: string]: Browser.storage.StorageChange;
};

/**
 * Same as `Partial`, but includes `| null`. It makes all the properties of an object optional and
 * nullable.
 */
type NullablePartial<T> = {
  [key in keyof T]+?: T[key] | undefined | null;
};
/**
 * Callback called when a value in storage is changed.
 */
export type WatchCallback<T> = (newValue: T, oldValue: T) => void;
/**
 * Call to remove a watch listener
 */
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
