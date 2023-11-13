import {
  Driver,
  WatchCallback,
  createStorage,
  defineDriver,
  Storage,
} from 'unstorage';
import browser, { Storage as BrowserStorage } from 'webextension-polyfill';

export interface WebExtensionDriverOptions {
  storageArea: 'sync' | 'local' | 'managed' | 'session';
}

export const webExtensionDriver: (opts: WebExtensionDriverOptions) => Driver =
  defineDriver((opts) => {
    const checkPermission = () => {
      if (browser.storage == null)
        throw Error(
          "You must request the 'storage' permission to use webExtensionDriver",
        );
    };

    const _storageListener: (
      changes: BrowserStorage.StorageAreaSyncOnChangedChangesType,
    ) => void = (changes) => {
      Object.entries(changes).forEach(([key, { newValue }]) => {
        _listeners.forEach((callback) => {
          callback(newValue ? 'update' : 'remove', key);
        });
      });
    };
    const _listeners = new Set<WatchCallback>();

    return {
      name: 'web-extension:' + opts.storageArea,
      async hasItem(key) {
        checkPermission();
        const res = await browser.storage[opts.storageArea].get(key);
        return res[key] != null;
      },
      async getItem(key) {
        checkPermission();
        const res = await browser.storage[opts.storageArea].get(key);
        return res[key] ?? null;
      },
      async getItems(items) {
        checkPermission();
        const res = await browser.storage[opts.storageArea].get(
          items.map((item) => item.key),
        );
        return items.map((item) => ({
          key: item.key,
          value: res[item.key] ?? null,
        }));
      },
      async setItem(key, value) {
        checkPermission();
        await browser.storage[opts.storageArea].set({ [key]: value ?? null });
      },
      async setItems(items) {
        checkPermission();
        const map = items.reduce<Record<string, any>>((map, item) => {
          map[item.key] = item.value ?? null;
          return map;
        }, {});
        await browser.storage[opts.storageArea].set(map);
      },
      async removeItem(key) {
        checkPermission();
        await browser.storage[opts.storageArea].remove(key);
      },
      async getKeys() {
        checkPermission();
        const all = await browser.storage[opts.storageArea].get();
        return Object.keys(all);
      },
      async clear() {
        checkPermission();
        await browser.storage[opts.storageArea].clear();
      },
      watch(callback) {
        checkPermission();
        _listeners.add(callback);
        if (_listeners.size === 1) {
          browser.storage[opts.storageArea].onChanged.addListener(
            _storageListener,
          );
        }

        return () => {
          _listeners.delete(callback);
          if (_listeners.size === 0) {
            browser.storage[opts.storageArea].onChanged.removeListener(
              _storageListener,
            );
          }
        };
      },
    };
  });

function createWebExtensionStorage() {
  const storage = createStorage();
  storage.mount('local', webExtensionDriver({ storageArea: 'local' }));
  storage.mount('session', webExtensionDriver({ storageArea: 'session' }));
  storage.mount('sync', webExtensionDriver({ storageArea: 'sync' }));
  storage.mount('managed', webExtensionDriver({ storageArea: 'managed' }));
  return storage;
}

export type StorageValue = null | string | number | boolean | object;

export const storage: Storage<StorageValue> = createWebExtensionStorage();

export * from 'unstorage';
