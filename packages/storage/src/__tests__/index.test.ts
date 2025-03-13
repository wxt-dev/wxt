import { fakeBrowser } from '@webext-core/fake-browser';
import { describe, it, expect, beforeEach, vi, expectTypeOf } from 'vitest';
import { MigrationError, type WxtStorageItem, storage } from '../index';

/**
 * This works because fakeBrowser is synchronous, and is will finish any number of chained
 * calls within a single tick of the event loop, ie: a timeout of 0.
 */
async function waitForMigrations() {
  return new Promise((res) => setTimeout(res));
}

/**
 * Same as `waitForMigrations`, the fake browser being synchronous means the
 * `init` logic is finished by the next task in the event queue.
 */
async function waitForInit() {
  return new Promise((res) => setTimeout(res));
}

describe('Storage Utils', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    storage.unwatch();
  });

  describe.each(['local', 'sync', 'managed', 'session'] as const)(
    'storage - %s',
    (storageArea) => {
      describe('getItem', () => {
        it('should return the value from the correct storage area', async () => {
          const expected = 123;
          await fakeBrowser.storage[storageArea].set({ count: expected });

          const actual = await storage.getItem(`${storageArea}:count`);

          expect(actual).toBe(expected);
        });

        it('should return the value if multiple : are used in the key', async () => {
          const expected = 'value';
          await fakeBrowser.storage[storageArea].set({ 'some:key': expected });

          const actual = await storage.getItem(`${storageArea}:some:key`);

          expect(actual).toBe(expected);
        });

        it("should return null if the value doesn't exist", async () => {
          const actual = await storage.getItem(`${storageArea}:count`);

          expect(actual).toBeNull();
        });

        it('should return the default value if passed in options', async () => {
          const expected = 0;
          const actual = await storage.getItem(`${storageArea}:count`, {
            defaultValue: expected,
          });

          expect(actual).toBe(expected);
        });
      });

      describe('getItems', () => {
        it('should get values from multiple storage keys', async () => {
          const item1 = {
            key: `${storageArea}:one`,
            expectedValue: 1,
          } as const;
          const item2 = {
            key: `${storageArea}:two`,
            expectedValue: null,
          } as const;

          await fakeBrowser.storage[storageArea].set({
            one: item1.expectedValue,
          });

          const actual = await storage.getItems([item1.key, item2.key]);

          expect(actual).toEqual([
            { key: item1.key, value: item1.expectedValue },
            { key: item2.key, value: item2.expectedValue },
          ]);
        });

        it('should get values from multiple storage items', async () => {
          const item1 = storage.defineItem(`${storageArea}:one`);
          const expectedValue1 = 1;
          const item2 = storage.defineItem(`${storageArea}:two`);
          const expectedValue2 = null;

          await fakeBrowser.storage[storageArea].set({
            one: expectedValue1,
          });

          const actual = await storage.getItems([item1, item2]);

          expect(actual).toEqual([
            { key: item1.key, value: expectedValue1 },
            { key: item2.key, value: expectedValue2 },
          ]);
        });

        it('should get values for a combination of different input types', async () => {
          const key1 = `${storageArea}:one` as const;
          const expectedValue1 = 1;
          const item2 = storage.defineItem<number>(`${storageArea}:two`);
          const expectedValue2 = 2;

          await fakeBrowser.storage[storageArea].set({
            one: expectedValue1,
            two: expectedValue2,
          });

          const actual = await storage.getItems([key1, item2]);

          expect(actual).toEqual([
            { key: key1, value: expectedValue1 },
            { key: item2.key, value: expectedValue2 },
          ]);
        });

        it('should return fallback values for keys when provided', async () => {
          const key1 = `${storageArea}:one` as const;
          const expectedValue1 = null;
          const key2 = `${storageArea}:two` as const;
          const fallback2 = 2;
          const expectedValue2 = fallback2;

          const actual = await storage.getItems([
            key1,
            { key: key2, options: { fallback: fallback2 } },
          ]);

          expect(actual).toEqual([
            { key: key1, value: expectedValue1 },
            { key: key2, value: expectedValue2 },
          ]);
        });

        it('should return fallback values for items when provided', async () => {
          const item1 = storage.defineItem<number>(`${storageArea}:one`);
          const expectedValue1 = null;
          const item2 = storage.defineItem(`${storageArea}:two`, {
            fallback: 2,
          });
          const expectedValue2 = item2.fallback;

          const actual = await storage.getItems([item1, item2]);

          expect(actual).toEqual([
            { key: item1.key, value: expectedValue1 },
            { key: item2.key, value: expectedValue2 },
          ]);
        });
      });

      describe('getMeta', () => {
        it('should return item metadata from key+$', async () => {
          const expected = { v: 1 };
          await fakeBrowser.storage[storageArea].set({ count$: expected });

          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual(expected);
        });

        it('should return an empty object if missing', async () => {
          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual({});
        });
      });

      describe('setItem', () => {
        it('should set the value in the correct storage area', async () => {
          const key = `${storageArea}:count` as const;
          const value = 321;

          await storage.setItem(key, value);
        });

        it.each([undefined, null])(
          'should remove the item from storage when setting the value to %s',
          async (value) => {
            await fakeBrowser.storage[storageArea].set({ count: 345 });
            await storage.setItem(`${storageArea}:count`, value as null);

            // For some reason storage sets the value to "null" instead of deleting it. So using
            // fakeBrowser during the expect fails. Using storage works. I've confirmed that this
            // doesn't happen in a real extension environment.
            expect(await storage.getItem(`${storageArea}:count`)).toBeNull();
          },
        );
      });

      describe('setItems', () => {
        it('should set multiple items in storage', async () => {
          const expected = [
            { key: `${storageArea}:count` as const, value: 234 },
            { key: `${storageArea}:installDate` as const, value: null },
          ];
          await fakeBrowser.storage[storageArea].set({
            count: 123,
            installDate: 321,
          });

          await storage.setItems(expected);
          const actual = await storage.getItems(
            expected.map((item) => item.key),
          );

          expect(actual).toHaveLength(2);
          expected.forEach((item) => {
            expect(actual).toContainEqual(item);
          });
        });
      });

      describe('setMeta', () => {
        it('should set metadata at key+$', async () => {
          const existing = { v: 1 };
          await chrome.storage[storageArea].set({ count$: existing });
          const newValues = {
            date: Date.now(),
          };
          const expected = { ...existing, ...newValues };

          await storage.setMeta(`${storageArea}:count`, newValues);
          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual(expected);
        });

        it.each([undefined, null])(
          'should remove any properties set to %s',
          async (version) => {
            const existing = { v: 1 };
            await chrome.storage[storageArea].set({ count$: existing });
            const expected = {};

            await storage.setMeta(`${storageArea}:count`, { v: version });
            const actual = await storage.getMeta(`${storageArea}:count`);

            expect(actual).toEqual(expected);
          },
        );
      });

      describe('setMetas', () => {
        it('should set key metadata correctly', async () => {
          const key1 = `${storageArea}:one` as const;
          const initialMeta1 = {};
          const setMeta1 = { v: 1 };
          const expectedMeta1 = setMeta1;

          const key2 = `${storageArea}:two` as const;
          const initialMeta2 = { v: 1 };
          const setMeta2 = { v: 2 };
          const expectedMeta2 = setMeta2;

          const key3 = `${storageArea}:three` as const;
          const initialMeta3 = { v: 1 };
          const setMeta3 = { d: Date.now() };
          const expectedMeta3 = { ...initialMeta3, ...setMeta3 };

          await fakeBrowser.storage[storageArea].set({
            one$: initialMeta1,
            two$: initialMeta2,
            three$: initialMeta3,
          });

          await storage.setMetas([
            { key: key1, meta: setMeta1 },
            { key: key2, meta: setMeta2 },
            { key: key3, meta: setMeta3 },
          ]);

          expect(await storage.getMeta(key1)).toEqual(expectedMeta1);
          expect(await storage.getMeta(key2)).toEqual(expectedMeta2);
          expect(await storage.getMeta(key3)).toEqual(expectedMeta3);
        });

        it('should set item metadata correctly', async () => {
          const item1 = storage.defineItem(`${storageArea}:one`);
          const initialMeta1 = {};
          const setMeta1 = { v: 1 };
          const expectedMeta1 = setMeta1;

          const item2 = storage.defineItem(`${storageArea}:two`);
          const initialMeta2 = { v: 1 };
          const setMeta2 = { v: 2 };
          const expectedMeta2 = setMeta2;

          const item3 = storage.defineItem(`${storageArea}:three`);
          const initialMeta3 = { v: 1 };
          const setMeta3 = { d: Date.now() };
          const expectedMeta3 = { ...initialMeta3, ...setMeta3 };

          await fakeBrowser.storage[storageArea].set({
            one$: initialMeta1,
            two$: initialMeta2,
            three$: initialMeta3,
          });

          await storage.setMetas([
            { item: item1, meta: setMeta1 },
            { item: item2, meta: setMeta2 },
            { item: item3, meta: setMeta3 },
          ]);

          expect(await item1.getMeta()).toEqual(expectedMeta1);
          expect(await item2.getMeta()).toEqual(expectedMeta2);
          expect(await item3.getMeta()).toEqual(expectedMeta3);
        });
      });

      describe('removeItem', () => {
        it('should remove the key from storage', async () => {
          await fakeBrowser.storage[storageArea].set({ count: 456 });

          await storage.removeItem(`${storageArea}:count`);
          const actual = await storage.getItem(`${storageArea}:count`);

          expect(actual).toBeNull();
        });

        it('should not remove the metadata by default', async () => {
          const expected = { v: 1 };
          await fakeBrowser.storage[storageArea].set({
            count$: expected,
            count: 3,
          });

          await storage.removeItem(`${storageArea}:count`);
          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual(expected);
        });

        it('should remove the metadata when requested', async () => {
          await fakeBrowser.storage[storageArea].set({
            count$: { v: 1 },
            count: 3,
          });

          await storage.removeItem(`${storageArea}:count`, {
            removeMeta: true,
          });
          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual({});
        });
      });

      describe('removeItems', () => {
        it('should remove multiple keys', async () => {
          const key1 = `${storageArea}:one` as const;
          const key2 = `${storageArea}:two` as const;
          await fakeBrowser.storage[storageArea].set({
            one: 1,
            two: 2,
          });

          await storage.removeItems([key1, key2]);

          expect(await storage.getItem(key1)).toBeNull();
          expect(await storage.getItem(key2)).toBeNull();
        });

        it('should remove multiple keys and metadata when requested', async () => {
          const key1 = `${storageArea}:one` as const;
          const key2 = `${storageArea}:two` as const;
          await fakeBrowser.storage[storageArea].set({
            one: 1,
            one$: { v: 1 },
            two: 2,
            two$: { v: 1 },
          });

          await storage.removeItems([
            key1,
            { key: key2, options: { removeMeta: true } },
          ]);

          expect(await storage.getItem(key1)).toBeNull();
          expect(await storage.getMeta(key1)).toEqual({ v: 1 });
          expect(await storage.getItem(key2)).toBeNull();
          expect(await storage.getMeta(key2)).toEqual({});
        });

        it('should remove multiple items', async () => {
          const item1 = storage.defineItem(`${storageArea}:one`);
          const item2 = storage.defineItem(`${storageArea}:two`);
          await fakeBrowser.storage[storageArea].set({
            one: 1,
            two: 2,
          });

          await storage.removeItems([item1, item2]);

          expect(await item1.getValue()).toBeNull();
          expect(await item2.getValue()).toBeNull();
        });

        it('should remove multiple items and metadata when requested', async () => {
          const item1 = storage.defineItem(`${storageArea}:one`);
          const item2 = storage.defineItem(`${storageArea}:two`);
          await fakeBrowser.storage[storageArea].set({
            one: 1,
            one$: { v: 1 },
            two: 2,
            two$: { v: 1 },
          });

          await storage.removeItems([
            item1,
            { item: item2, options: { removeMeta: true } },
          ]);

          expect(await item1.getValue()).toBeNull();
          expect(await item1.getMeta()).toEqual({ v: 1 });
          expect(await item2.getValue()).toBeNull();
          expect(await item2.getMeta()).toEqual({});
        });

        it('should remove multiple items', async () => {
          const item1 = storage.defineItem(`${storageArea}:one`);
          const item2 = storage.defineItem(`${storageArea}:two`);

          await fakeBrowser.storage.local.set({
            one: 1,
            two: 2,
          });

          await storage.removeItems([item1, item2]);

          expect(await item1.getValue()).toBeNull();
          expect(await item2.getValue()).toBeNull();
        });

        it('should remove items using { item: WxtStorageItem, options?: RemoveItemOptions } objects', async () => {
          const item1 = storage.defineItem('local:item1');
          const item2 = storage.defineItem('session:item2');

          await item1.setValue('value1');
          await item1.setMeta({ v: 1 });
          await item2.setValue('value2');
          await item2.setMeta({ v: 1 });

          await storage.removeItems([
            { item: item1, options: { removeMeta: true } },
            { item: item2, options: { removeMeta: false } },
          ]);

          expect(await item1.getValue()).toBeNull();
          expect(await item1.getMeta()).toEqual({});
          expect(await item2.getValue()).toBeNull();
          expect(await item2.getMeta()).toEqual({ v: 1 });
        });

        it('should handle a mix of different input types', async () => {
          const item1 = storage.defineItem('local:item1');
          const item2 = storage.defineItem('session:item2');
          const item3 = storage.defineItem('local:item3');

          await item1.setValue('value1');
          await item2.setValue('value2');
          await item3.setValue('value3');

          await storage.removeItems([
            'local:item1',
            item2,
            { key: 'local:item3', options: { removeMeta: true } },
          ]);

          expect(await storage.getItem('local:item1')).toBeNull();
          expect(await item2.getValue()).toBeNull();
          expect(await item3.getValue()).toBeNull();
          expect(await item3.getMeta()).toEqual({});
        });

        it('should not throw an error when removing non-existent items', async () => {
          const item = storage.defineItem('local:non_existent');

          await expect(storage.removeItems([item])).resolves.not.toThrow();
        });
      });

      describe('clear', () => {
        it('should remove all items', async () => {
          await fakeBrowser.storage[storageArea].set({
            one: 1,
            two: 2,
          });

          await storage.clear(storageArea);
          expect(await fakeBrowser.storage[storageArea].get()).toEqual({});
        });
      });

      describe('removeMeta', () => {
        it('should remove all metadata', async () => {
          await fakeBrowser.storage[storageArea].set({ count$: { v: 4 } });

          await storage.removeMeta(`${storageArea}:count`);
          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual({});
        });

        it('should only remove specific properties', async () => {
          await fakeBrowser.storage[storageArea].set({
            count$: { v: 4, d: Date.now() },
          });

          await storage.removeMeta(`${storageArea}:count`, ['d']);
          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual({ v: 4 });
        });
      });

      describe('snapshot', () => {
        it('should return a snapshot of the entire storage without area prefixes', async () => {
          const expected = {
            count: 1,
            count$: { v: 2 },
            example: 'test',
          };

          await fakeBrowser.storage[storageArea].set(expected);
          const actual = await storage.snapshot(storageArea);

          expect(actual).toEqual(expected);
        });

        it('should exclude specific properties and their metadata', async () => {
          const input = {
            count: 1,
            count$: { v: 2 },
            example: 'test',
          };
          const excludeKeys = ['count'];
          const expected = {
            example: 'test',
          };

          await fakeBrowser.storage[storageArea].set(input);
          const actual = await storage.snapshot(storageArea, { excludeKeys });

          expect(actual).toEqual(expected);
        });
      });

      describe('restoreSnapshot', () => {
        it('should restore a snapshot object by setting all values in storage', async () => {
          const data = {
            one: 'one',
            two: 'two',
          };
          const existing = {
            two: 'two-two',
            three: 'three',
          };
          await fakeBrowser.storage[storageArea].set(existing);

          await storage.restoreSnapshot(storageArea, data);
          const actual = await storage.snapshot(storageArea);

          expect(actual).toEqual({ ...existing, ...data });
        });

        it('should overwrite, not merge, any metadata keys in the snapshot', async () => {
          const existing = {
            count: 1,
            count$: {
              v: 2,
            },
          };
          const data = {
            count$: {
              restoredAt: Date.now(),
            },
          };
          const expected = {
            ...existing,
            count$: data.count$,
          };
          await fakeBrowser.storage[storageArea].set(existing);

          await storage.restoreSnapshot(storageArea, data);
          const actual = await storage.snapshot(storageArea);

          expect(actual).toEqual(expected);
        });
      });

      describe('watch', () => {
        it('should not trigger if the changed key is different from the requested key', async () => {
          const cb = vi.fn();

          storage.watch(`${storageArea}:key`, cb);
          await storage.setItem(`${storageArea}:not-the-key`, '123');

          expect(cb).not.toBeCalled();
        });

        it("should not trigger if the value doesn't change", async () => {
          const cb = vi.fn();
          const value = '123';

          await storage.setItem(`${storageArea}:key`, value);
          storage.watch(`${storageArea}:key`, cb);
          await storage.setItem(`${storageArea}:key`, value);

          expect(cb).not.toBeCalled();
        });

        it('should call the callback when the value changes', async () => {
          const cb = vi.fn();
          const newValue = '123';
          const oldValue = null;

          storage.watch(`${storageArea}:key`, cb);
          await storage.setItem(`${storageArea}:key`, newValue);

          expect(cb).toBeCalledTimes(1);
          expect(cb).toBeCalledWith(newValue, oldValue);
        });

        it('should remove the listener when calling the returned function', async () => {
          const cb = vi.fn();

          const unwatch = storage.watch(`${storageArea}:key`, cb);
          unwatch();
          await storage.setItem(`${storageArea}:key`, '123');

          expect(cb).not.toBeCalled();
        });
      });

      describe('unwatch', () => {
        it('should remove all watch listeners', async () => {
          const cb = vi.fn();

          storage.watch(`${storageArea}:key`, cb);
          storage.unwatch();
          await storage.setItem(`${storageArea}:key`, '123');

          expect(cb).not.toBeCalled();
        });
      });
    },
  );

  describe('Invalid storage areas', () => {
    it('should not accept keys without a valid storage area prefix', async () => {
      // @ts-expect-error
      await storage.getItem('test').catch(() => {});
      // @ts-expect-error
      await storage.getItem('loca:test').catch(() => {});
    });

    it('should throw an error when using an invalid storage area', async () => {
      // @ts-expect-error: Test passes if there is a type error here
      await expect(storage.getItem('invalidArea:key')).rejects.toThrow(
        'Invalid area',
      );
    });
  });

  describe('defineItem', () => {
    describe('versioning', () => {
      it('should migrate values to the latest when a version upgrade is detected', async () => {
        await fakeBrowser.storage.local.set({
          count: 2,
          count$: { v: 1 },
        });
        const migrateToV2 = vi.fn((oldCount) => oldCount * 2);
        const migrateToV3 = vi.fn((oldCount) => oldCount * 3);

        const item = storage.defineItem<number, { v: number }>(`local:count`, {
          defaultValue: 0,
          version: 3,
          migrations: {
            2: migrateToV2,
            3: migrateToV3,
          },
        });
        await waitForMigrations();

        const actualValue = await item.getValue();
        const actualMeta = await item.getMeta();

        expect(actualValue).toEqual(12);
        expect(actualMeta).toEqual({ v: 3 });

        expect(migrateToV2).toBeCalledTimes(1);
        expect(migrateToV2).toBeCalledWith(2);

        expect(migrateToV3).toBeCalledTimes(1);
        expect(migrateToV3).toBeCalledWith(4);
      });

      it("should not run migrations if the value doesn't exist yet", async () => {
        const migrateToV2 = vi.fn((oldCount) => oldCount * 2);
        const migrateToV3 = vi.fn((oldCount) => oldCount * 3);

        const item = storage.defineItem<number, { v: number }>(`local:count`, {
          defaultValue: 0,
          version: 3,
          migrations: {
            2: migrateToV2,
            3: migrateToV3,
          },
        });
        await waitForMigrations();

        const actualValue = await item.getValue();
        const actualMeta = await item.getMeta();

        expect(actualValue).toEqual(0);
        expect(actualMeta).toEqual({});

        expect(migrateToV2).not.toBeCalled();
        expect(migrateToV3).not.toBeCalled();
      });

      it('should run the v2 migration when converting an unversioned item to a versioned one', async () => {
        await fakeBrowser.storage.local.set({
          count: 2,
        });
        const migrateToV2 = vi.fn((oldCount) => oldCount * 2);

        const item = storage.defineItem<number, { v: number }>(`local:count`, {
          defaultValue: 0,
          version: 2,
          migrations: {
            2: migrateToV2,
          },
        });
        await waitForMigrations();

        const actualValue = await item.getValue();
        const actualMeta = await item.getMeta();

        expect(actualValue).toEqual(4);
        expect(actualMeta).toEqual({ v: 2 });

        expect(migrateToV2).toBeCalledTimes(1);
        expect(migrateToV2).toBeCalledWith(2);
      });

      it('should not run old migrations if the version is unchanged', async () => {
        await fakeBrowser.storage.local.set({
          count: 2,
          count$: { v: 3 },
        });
        const migrateToV2 = vi.fn((oldCount) => oldCount * 2);
        const migrateToV3 = vi.fn((oldCount) => oldCount * 3);

        storage.defineItem<number, { v: number }>(`local:count`, {
          defaultValue: 0,
          version: 3,
          migrations: {
            2: migrateToV2,
            3: migrateToV3,
          },
        });
        await waitForMigrations();

        expect(migrateToV2).not.toBeCalled();
        expect(migrateToV3).not.toBeCalled();
      });

      it('should skip missing migration functions', async () => {
        await fakeBrowser.storage.local.set({
          count: 2,
          count$: { v: 0 },
        });
        const migrateToV1 = vi.fn((oldCount) => oldCount * 1);
        const migrateToV3 = vi.fn((oldCount) => oldCount * 3);

        const item = storage.defineItem<number, { v: number }>(`local:count`, {
          defaultValue: 0,
          version: 3,
          migrations: {
            1: migrateToV1,
            3: migrateToV3,
          },
        });
        await waitForMigrations();

        const actualValue = await item.getValue();
        const actualMeta = await item.getMeta();

        expect(actualValue).toEqual(6);
        expect(actualMeta).toEqual({ v: 3 });

        expect(migrateToV1).toBeCalledTimes(1);
        expect(migrateToV1).toBeCalledWith(2);

        expect(migrateToV3).toBeCalledTimes(1);
        expect(migrateToV3).toBeCalledWith(2);
      });

      it('should throw an error if the new version is less than the previous version', async () => {
        const prevVersion = 2;
        const nextVersion = 1;
        await fakeBrowser.storage.local.set({
          count: 0,
          count$: { v: prevVersion },
        });

        const item = storage.defineItem(`local:count`, {
          defaultValue: 0,
          version: nextVersion,
        });
        await waitForMigrations();

        await expect(item.migrate()).rejects.toThrow(
          'Version downgrade detected (v2 -> v1) for "local:count"',
        );
      });

      it('should throw an error when defining an item with an invalid version', () => {
        expect(() => storage.defineItem('local:key', { version: 0 })).toThrow(
          'Storage item version cannot be less than 1',
        );
      });

      it('should handle errors in migration functions', async () => {
        const cause = Error('Some error');
        const expectedError = new MigrationError('local:key', 2, { cause });
        const item = storage.defineItem<number>('local:key', {
          version: 3,
          migrations: {
            2: () => {
              throw cause;
            },
          },
        });
        await fakeBrowser.storage.local.set({ key: 1, key$: { v: 1 } });

        await expect(item.migrate()).rejects.toThrow(expectedError);
      });
    });
    it('should print migration logs if debug option is true', async () => {
      await fakeBrowser.storage.local.set({
        count: 2,
        count$: { v: 1 },
      });
      const migrateToV2 = vi.fn((oldCount) => oldCount * 2);
      const migrateToV3 = vi.fn((oldCount) => oldCount * 3);
      const consoleSpy = vi.spyOn(console, 'debug');

      storage.defineItem<number, { v: number }>(`local:count`, {
        defaultValue: 0,
        version: 3,
        migrations: {
          2: migrateToV2,
          3: migrateToV3,
        },
        debug: true,
      });
      await waitForMigrations();

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      expect(consoleSpy).toHaveBeenCalledWith(
        `[@wxt-dev/storage] Running storage migration for local:count: v1 -> v3`,
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        `[@wxt-dev/storage] Storage migration processed for version: v2`,
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        `[@wxt-dev/storage] Storage migration processed for version: v3`,
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        `[@wxt-dev/storage] Storage migration completed for local:count v3`,
        { migratedValue: expect.any(Number) },
      );
    });

    describe('getValue', () => {
      it('should return the value from storage', async () => {
        const expected = 2;
        const item = storage.defineItem<number>(`local:count`);
        await fakeBrowser.storage.local.set({ count: expected });

        const actual = await item.getValue();

        expect(actual).toBe(expected);
      });

      it('should return null if missing', async () => {
        const item = storage.defineItem<number>(`local:count`);

        const actual = await item.getValue();

        expect(actual).toBeNull();
      });

      it('should return the provided default value if missing', async () => {
        const expected = 0;
        const item = storage.defineItem(`local:count`, {
          defaultValue: expected,
        });

        const actual = await item.getValue();

        expect(actual).toEqual(expected);
      });
    });

    describe('getMeta', () => {
      it('should return the value from storage at key+$', async () => {
        const expected = { v: 2 };
        const item = storage.defineItem<number, { v: number }>(`local:count`);
        await fakeBrowser.storage.local.set({ count$: expected });

        const actual = await item.getMeta();

        expect(actual).toBe(expected);
      });

      it('should return an empty object if missing', async () => {
        const expected = {};
        const item = storage.defineItem<number, { v: number }>(`local:count`);

        const actual = await item.getMeta();

        expect(actual).toEqual(expected);
      });
    });

    describe('setValue', () => {
      it('should set the value in storage', async () => {
        const expected = 1;
        const item = storage.defineItem<number>(`local:count`);

        await item.setValue(expected);
        const actual = await item.getValue();

        expect(actual).toBe(expected);
      });

      it.each([undefined, null])(
        'should remove the value in storage when %s is passed in',
        async (value) => {
          const item = storage.defineItem<number>(`local:count`);

          // @ts-expect-error: undefined is not assignable to null, but we're testing that case on purpose
          await item.setValue(value);
          const actual = await item.getValue();

          expect(actual).toBeNull();
        },
      );
    });

    describe('setMeta', () => {
      it('should set metadata at key+$', async () => {
        const expected = { date: Date.now() };
        const item = storage.defineItem<number, { date: number }>(
          `local:count`,
        );

        await item.setMeta(expected);
        const actual = await item.getMeta();

        expect(actual).toEqual(expected);
      });

      it('should add to metadata if already present', async () => {
        const existing = { v: 2 };
        const newFields = { date: Date.now() };
        const expected = { ...existing, ...newFields };
        const item = storage.defineItem<number, { date: number; v: number }>(
          `local:count`,
        );
        await fakeBrowser.storage.local.set({
          count$: existing,
        });

        await item.setMeta(newFields);
        const actual = await item.getMeta();

        expect(actual).toEqual(expected);
      });
    });

    describe('removeValue', () => {
      it('should remove the key from storage', async () => {
        const item = storage.defineItem(`local:count`);
        await fakeBrowser.storage.local.set({ count: 456 });

        await item.removeValue();
        const actual = await item.getValue();

        expect(actual).toBeNull();
      });

      it('should not remove the metadata by default', async () => {
        const item = storage.defineItem(`local:count`);
        const expected = { v: 1 };
        await fakeBrowser.storage.local.set({
          count$: expected,
          count: 3,
        });

        await item.removeValue();
        const actual = await item.getMeta();

        expect(actual).toEqual(expected);
      });

      it('should remove the metadata when requested', async () => {
        const item = storage.defineItem(`local:count`);
        await fakeBrowser.storage.local.set({
          count$: { v: 1 },
          count: 3,
        });

        await item.removeValue({ removeMeta: true });
        const actual = await item.getMeta();

        expect(actual).toEqual({});
      });
    });

    describe('removeMeta', () => {
      it('should remove all metadata', async () => {
        const item = storage.defineItem<number, { v: number }>(`local:count`);
        await fakeBrowser.storage.local.set({ count$: { v: 4 } });

        await item.removeMeta();
        const actual = await item.getMeta();

        expect(actual).toEqual({});
      });

      it('should only remove specific properties', async () => {
        const item = storage.defineItem<number, { v: number; d: number }>(
          `local:count`,
        );
        await fakeBrowser.storage.local.set({
          count$: { v: 4, d: Date.now() },
        });

        await item.removeMeta(['d']);
        const actual = await item.getMeta();

        expect(actual).toEqual({ v: 4 });
      });
    });

    describe('watch', () => {
      it("should not trigger if the changed key is different from the item's key", async () => {
        const item = storage.defineItem(`local:key`);
        const cb = vi.fn();

        item.watch(cb);
        await storage.setItem(`local:not-the-key`, '123');

        expect(cb).not.toBeCalled();
      });

      it("should not trigger if the value doesn't change", async () => {
        const item = storage.defineItem(`local:key`);
        const cb = vi.fn();
        const value = '123';

        await item.setValue(value);
        item.watch(cb);
        await item.setValue(value);

        expect(cb).not.toBeCalled();
      });

      it('should call the callback when the value changes', async () => {
        const item = storage.defineItem(`local:key`);
        const cb = vi.fn();
        const newValue = '123';
        const oldValue = null;

        item.watch(cb);
        await item.setValue(newValue);

        expect(cb).toBeCalledTimes(1);
        expect(cb).toBeCalledWith(newValue, oldValue);
      });

      it('should use the default value for the newValue when the item is removed', async () => {
        const defaultValue = 'default';
        const item = storage.defineItem<string>(`local:key`, {
          defaultValue,
        });
        const cb = vi.fn();
        const oldValue = '123';
        await item.setValue(oldValue);

        item.watch(cb);
        await item.removeValue();

        expect(cb).toBeCalledTimes(1);
        expect(cb).toBeCalledWith(defaultValue, oldValue);
      });

      it("should use the default value for the oldItem when the item didn't exist in storage yet", async () => {
        const defaultValue = 'default';
        const item = storage.defineItem<string>(`local:key`, {
          defaultValue,
        });
        const cb = vi.fn();
        const newValue = '123';
        await item.removeValue();

        item.watch(cb);
        await item.setValue(newValue);

        expect(cb).toBeCalledTimes(1);
        expect(cb).toBeCalledWith(newValue, defaultValue);
      });

      it('should remove the listener when calling the returned function', async () => {
        const item = storage.defineItem(`local:key`);
        const cb = vi.fn();

        const unwatch = item.watch(cb);
        unwatch();
        await item.setValue('123');

        expect(cb).not.toBeCalled();
      });
    });

    describe('unwatch', () => {
      it('should remove all watch listeners', async () => {
        const item = storage.defineItem(`local:key`);
        const cb = vi.fn();

        item.watch(cb);
        storage.unwatch();
        await item.setValue('123');

        expect(cb).not.toBeCalled();
      });
    });

    describe.each(['fallback', 'defaultValue'] as const)(
      '%s option',
      (fallbackKey) => {
        it('should return the default value when provided', () => {
          const fallback = 123;
          const item = storage.defineItem(`local:test`, {
            [fallbackKey]: fallback,
          });

          expect(item.fallback).toBe(fallback);
          expect(item.defaultValue).toBe(fallback);
        });

        it('should return null when not provided', () => {
          const item = storage.defineItem<number>(`local:test`);

          expect(item.fallback).toBeNull();
          expect(item.defaultValue).toBeNull();
        });
      },
    );

    describe('init option', () => {
      it('should only call init once (per JS context) when calling getValue successively, avoiding race conditions', async () => {
        const expected = 1;
        const init = vi
          .fn()
          .mockResolvedValueOnce(expected)
          .mockResolvedValue('not' + expected);
        const item = storage.defineItem('local:test', { init });

        await waitForInit();

        const p1 = item.getValue();
        const p2 = item.getValue();

        await expect(p1).resolves.toBe(expected);
        await expect(p2).resolves.toBe(expected);

        expect(init).toBeCalledTimes(1);
      });

      it('should initialize the value in storage immediately', async () => {
        const expected = 1;
        const init = vi.fn().mockReturnValue(expected);
        storage.defineItem('local:test', { init });

        await waitForInit();

        await expect(storage.getItem('local:test')).resolves.toBe(expected);
      });

      it("should re-initialize a value on the next call to getValue if it's been removed", async () => {
        const init = vi.fn().mockImplementation(Math.random);
        const item = storage.defineItem<number>('local:key', { init });
        await waitForInit();

        await item.removeValue();
        // Make sure it's actually blank before running the test
        expect(await chrome.storage.local.get()).toEqual({});
        init.mockClear();

        const [value1, value2] = await Promise.all([
          item.getValue(),
          item.getValue(),
        ]);
        expect(init).toBeCalledTimes(1);
        expect(value1).toBe(value2);
      });
    });

    describe('types', () => {
      it('should define a nullable value when options are not passed', () => {
        const item = storage.defineItem<number>(`local:test`);
        expectTypeOf(item).toEqualTypeOf<WxtStorageItem<number | null, {}>>();
      });

      it('should define a non-null value when options are passed with a nullish default value', () => {
        const item = storage.defineItem(`local:test`, {
          defaultValue: 123,
        });
        expectTypeOf(item).toEqualTypeOf<WxtStorageItem<number, {}>>();
      });

      it('should define a nullable value when options are passed with null default value', () => {
        const item = storage.defineItem<number | null>(`local:test`, {
          defaultValue: null,
        });
        expectTypeOf(item).toEqualTypeOf<WxtStorageItem<number | null, {}>>();
      });
    });
  });

  describe('Multiple Storage Areas', () => {
    describe('getItems', () => {
      it('should get the values of multiple storage items efficiently', async () => {
        const item1 = storage.defineItem<number>('local:item1');
        const item2 = storage.defineItem<string>('session:item2');
        const item3 = storage.defineItem<boolean>('local:item3');

        await item1.setValue(42);
        await item2.setValue('hello');
        await item3.setValue(false);

        const localGetSpy = vi.spyOn(fakeBrowser.storage.local, 'get');
        const sessionGetSpy = vi.spyOn(fakeBrowser.storage.session, 'get');

        const values = await storage.getItems([item1, item2, item3]);

        expect(values).toEqual([
          {
            key: 'local:item1',
            value: 42,
          },
          {
            key: 'session:item2',
            value: 'hello',
          },
          {
            key: 'local:item3',
            value: false,
          },
        ]);

        expect(localGetSpy).toBeCalledTimes(1);
        expect(localGetSpy).toBeCalledWith(['item1', 'item3']);
        expect(sessionGetSpy).toBeCalledTimes(1);
        expect(sessionGetSpy).toBeCalledWith(['item2']);
      });

      it('should return values in the same order as input', async () => {
        const item1 = storage.defineItem<number>('local:item1');
        const item2 = storage.defineItem<string>('session:item2');
        const item3 = storage.defineItem<boolean>('local:item3');

        expect(await storage.getItems([item1, item2, item3])).toEqual([
          { key: item1.key, value: null },
          { key: item2.key, value: null },
          { key: item3.key, value: null },
        ]);
        expect(await storage.getItems([item3, item2, item1])).toEqual([
          { key: item3.key, value: null },
          { key: item2.key, value: null },
          { key: item1.key, value: null },
        ]);
      });
    });

    describe('getMetas', () => {
      it('should get the metadata of multiple storage items efficiently', async () => {
        const item1 = storage.defineItem<number, { v: number }>('local:item1');
        const item2 = storage.defineItem<string, { date: number }>(
          'session:item2',
        );
        const item3 = storage.defineItem<boolean, { flag: boolean }>(
          'local:item3',
        );

        await item1.setMeta({ v: 1 });
        await item2.setMeta({ date: 1234567890 });
        // item3 has no meta

        const localGetSpy = vi.spyOn(fakeBrowser.storage.local, 'get');
        const sessionGetSpy = vi.spyOn(fakeBrowser.storage.session, 'get');

        const metas = await storage.getMetas([item1, item2, item3]);

        expect(metas).toEqual([
          { key: item1.key, meta: { v: 1 } },
          { key: item2.key, meta: { date: 1234567890 } },
          { key: item3.key, meta: {} },
        ]);

        expect(localGetSpy).toBeCalledTimes(1);
        expect(localGetSpy).toBeCalledWith(['item1$', 'item3$']);
        expect(sessionGetSpy).toBeCalledTimes(1);
        expect(sessionGetSpy).toBeCalledWith(['item2$']);
      });

      it('should return the metadata in the same order as input', async () => {
        const item1 = storage.defineItem<number, { v: number }>('local:item1');
        const item2 = storage.defineItem<string, { date: number }>(
          'session:item2',
        );
        const item3 = storage.defineItem<boolean, { flag: boolean }>(
          'local:item3',
        );

        expect(await storage.getMetas([item1, item2, item3])).toEqual([
          { key: item1.key, meta: {} },
          { key: item2.key, meta: {} },
          { key: item3.key, meta: {} },
        ]);
        expect(await storage.getMetas([item3, item2, item1])).toEqual([
          { key: item3.key, meta: {} },
          { key: item2.key, meta: {} },
          { key: item1.key, meta: {} },
        ]);
      });
    });

    describe('setItems', () => {
      it('should set the values of multiple storage items efficiently', async () => {
        const item1 = storage.defineItem<number>('local:item1');
        const value1 = 100;
        const item2 = storage.defineItem<string>('session:item2');
        const value2 = 'test';
        const item3 = storage.defineItem<boolean>('local:item3');
        const value3 = true;

        const localSetSpy = vi.spyOn(fakeBrowser.storage.local, 'set');
        const sessionSetSpy = vi.spyOn(fakeBrowser.storage.session, 'set');

        await storage.setItems([
          { item: item1, value: value1 },
          { item: item2, value: value2 },
          { item: item3, value: value3 },
        ]);

        expect(localSetSpy).toBeCalledTimes(1);
        expect(localSetSpy).toBeCalledWith({ item1: value1, item3: value3 });
        expect(sessionSetSpy).toBeCalledTimes(1);
        expect(sessionSetSpy).toBeCalledWith({ item2: value2 });
      });
    });

    describe('setMetas', () => {
      it('should set metadata efficiently', async () => {
        const item1 = storage.defineItem<number, { v: number }>('local:one');
        const item2 = storage.defineItem<string, { v: number }>('session:two');
        const item3 = storage.defineItem<boolean, { v: number }>('local:three');
        await waitForInit();

        const localGetSpy = vi.spyOn(fakeBrowser.storage.local, 'get');
        const sessionGetSpy = vi.spyOn(fakeBrowser.storage.session, 'get');
        const localSetSpy = vi.spyOn(fakeBrowser.storage.local, 'set');
        const sessionSetSpy = vi.spyOn(fakeBrowser.storage.session, 'set');

        await storage.setMetas([
          { item: item1, meta: { v: 1 } },
          { item: item2, meta: { v: 2 } },
          { item: item3, meta: { v: 3 } },
        ]);

        console.log(localGetSpy.mock.calls);
        expect(localGetSpy).toBeCalledTimes(1);
        expect(localGetSpy).toBeCalledWith(['one$', 'three$']);
        expect(sessionGetSpy).toBeCalledTimes(1);
        expect(sessionGetSpy).toBeCalledWith(['two$']);

        expect(localSetSpy).toBeCalledTimes(1);
        expect(localSetSpy).toBeCalledWith({
          one$: { v: 1 },
          three$: { v: 3 },
        });
        expect(sessionSetSpy).toBeCalledTimes(1);
        expect(sessionSetSpy).toBeCalledWith({
          two$: { v: 2 },
        });
      });
    });

    it('should return a nullable type when getItem is called without a fallback', async () => {
      const res = await storage.getItem<string>('local:test');
      expectTypeOf(res).toBeNullable();
    });

    it('should return a non-null type when getItem is called with a fallback', async () => {
      const res = await storage.getItem('local:test', {
        fallback: 'test',
      });
      expectTypeOf(res).not.toBeNullable();
    });

    it('should return a non-null type when getItem is called with a fallback and the first type parameter is passed', async () => {
      const res = await storage.getItem<string>('local:test', {
        fallback: 'test',
      });
      expectTypeOf(res).not.toBeNullable();
    });
  });
});
