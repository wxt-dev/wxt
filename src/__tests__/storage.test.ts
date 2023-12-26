import { fakeBrowser } from '@webext-core/fake-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { browser } from '~/browser';
import { storage } from '~/storage';

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
        it('should return an array of values', async () => {
          const expected = [
            { key: `${storageArea}:count`, value: 234 },
            { key: `${storageArea}:installDate`, value: null },
            { key: `${storageArea}:otherValue`, value: 345 },
          ];
          const params = [
            expected[0].key,
            expected[1].key,
            {
              key: expected[2].key,
              options: { defaultValue: expected[2].value },
            },
          ];
          await fakeBrowser.storage[storageArea].set({
            count: expected[0].value,
          });

          const actual = await storage.getItems(params);

          expect(actual).toHaveLength(3);
          expected.forEach((item) => {
            expect(actual).toContainEqual(item);
          });
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
          const key = `${storageArea}:count`;
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
            { key: `${storageArea}:count`, value: 234 },
            { key: `${storageArea}:installDate`, value: null },
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
          await browser.storage[storageArea].set({ count$: existing });
          const newValues = {
            date: Date.now(),
          };
          const expected = { ...existing, ...newValues };

          await storage.setMeta(`${storageArea}:count`, newValues);
          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual(expected);
        });

        it.each([undefined, null])(
          'should remove any fields set to %s',
          async (version) => {
            const existing = { v: 1 };
            await browser.storage[storageArea].set({ count$: existing });
            const expected = {};

            await storage.setMeta(`${storageArea}:count`, { v: version });
            const actual = await storage.getMeta(`${storageArea}:count`);

            expect(actual).toEqual(expected);
          },
        );
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
        it('should remove multiple items', async () => {
          const key1 = `${storageArea}:one`;
          const key2 = `${storageArea}:two`;
          const key3 = `${storageArea}:three`;
          await fakeBrowser.storage[storageArea].set({
            ['one']: '1',
            ['two']: null,
            ['two$']: { v: 1 },
            ['three']: '1',
            ['three$']: { v: 1 },
          });

          await storage.removeItems([
            key1,
            key2,
            { key: key3, options: { removeMeta: true } },
          ]);

          expect(await storage.getItem(key1)).toBeNull();
          expect(await storage.getItem(key2)).toBeNull();
          expect(await storage.getMeta(key2)).toEqual({ v: 1 });
          expect(await storage.getItem(key3)).toBeNull();
          expect(await storage.getMeta(key3)).toEqual({});
        });
      });

      describe('removeMeta', () => {
        it('should remove all metadata', async () => {
          await fakeBrowser.storage[storageArea].set({ count$: { v: 4 } });

          await storage.removeMeta(`${storageArea}:count`);
          const actual = await storage.getMeta(`${storageArea}:count`);

          expect(actual).toEqual({});
        });

        it('should only remove specific fields', async () => {
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

        it('should exclude specific fields and their metadata', async () => {
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

      describe('defineItem', () => {
        describe('versioning', () => {
          /**
           * This works because fakeBrowser is syncrounous, and is will finish any number of chained
           * calls within a single tick of the event loop, ie: a timeout of 0.
           */
          async function waitForMigrations() {
            return new Promise((res) => setTimeout(res));
          }

          it('should migrate values to the latest when a version upgrade is detected', async () => {
            await fakeBrowser.storage[storageArea].set({
              count: 2,
              count$: { v: 1 },
            });
            const migrateToV2 = vi.fn((oldCount) => oldCount * 2);
            const migrateToV3 = vi.fn((oldCount) => oldCount * 3);

            const item = storage.defineItem<number, { v: number }>(
              `${storageArea}:count`,
              {
                version: 3,
                migrations: {
                  2: migrateToV2,
                  3: migrateToV3,
                },
              },
            );
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

            const item = storage.defineItem<number, { v: number }>(
              `${storageArea}:count`,
              {
                version: 3,
                migrations: {
                  2: migrateToV2,
                  3: migrateToV3,
                },
              },
            );
            await waitForMigrations();

            const actualValue = await item.getValue();
            const actualMeta = await item.getMeta();

            expect(actualValue).toBeNull();
            expect(actualMeta).toEqual({ v: 3 });

            expect(migrateToV2).not.toBeCalled();
            expect(migrateToV3).not.toBeCalled();
          });

          it('Should not run old migrations if the version is unchanged', async () => {
            await fakeBrowser.storage[storageArea].set({
              count: 2,
              count$: { v: 3 },
            });
            const migrateToV2 = vi.fn((oldCount) => oldCount * 2);
            const migrateToV3 = vi.fn((oldCount) => oldCount * 3);

            storage.defineItem<number, { v: number }>(`${storageArea}:count`, {
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
            await fakeBrowser.storage[storageArea].set({
              count: 2,
              count$: { v: 0 },
            });
            const migrateToV1 = vi.fn((oldCount) => oldCount * 1);
            const migrateToV3 = vi.fn((oldCount) => oldCount * 3);

            const item = storage.defineItem<number, { v: number }>(
              `${storageArea}:count`,
              {
                version: 3,
                migrations: {
                  1: migrateToV1,
                  3: migrateToV3,
                },
              },
            );
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
        });

        describe('getValue', () => {
          it('should return the value from storage', async () => {
            const expected = 2;
            const item = storage.defineItem<number>(`${storageArea}:count`);
            await fakeBrowser.storage[storageArea].set({ count: expected });

            const actual = await item.getValue();

            expect(actual).toBe(expected);
          });

          it('should return null if missing', async () => {
            const item = storage.defineItem<number>(`${storageArea}:count`);

            const actual = await item.getValue();

            expect(actual).toBeNull();
          });

          it('should return the provided default value if missing', async () => {
            const expected = 0;
            const item = storage.defineItem(`${storageArea}:count`, {
              defaultValue: expected,
            });

            const actual = await item.getValue();

            expect(actual).toEqual(expected);
          });
        });

        describe('getMeta', () => {
          it('should return the value from storage at key+$', async () => {
            const expected = { v: 2 };
            const item = storage.defineItem<number, { v: number }>(
              `${storageArea}:count`,
            );
            await fakeBrowser.storage[storageArea].set({ count$: expected });

            const actual = await item.getMeta();

            expect(actual).toBe(expected);
          });

          it('should return an empty object if missing', async () => {
            const expected = {};
            const item = storage.defineItem<number, { v: number }>(
              `${storageArea}:count`,
            );

            const actual = await item.getMeta();

            expect(actual).toEqual(expected);
          });
        });

        describe('setValue', () => {
          it('should set the value in storage', async () => {
            const expected = 1;
            const item = storage.defineItem<number>(`${storageArea}:count`);

            await item.setValue(expected);
            const actual = await item.getValue();

            expect(actual).toBe(expected);
          });

          it.each([undefined, null])(
            'should remove the value in storage when %s is passed in',
            async (value) => {
              const item = storage.defineItem<number>(`${storageArea}:count`);

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
              `${storageArea}:count`,
            );

            await item.setMeta(expected);
            const actual = await item.getMeta();

            expect(actual).toEqual(expected);
          });

          it('should add to metadata if already present', async () => {
            const existing = { v: 2 };
            const newFields = { date: Date.now() };
            const expected = { ...existing, ...newFields };
            const item = storage.defineItem<
              number,
              { date: number; v: number }
            >(`${storageArea}:count`);
            await fakeBrowser.storage[storageArea].set({
              count$: existing,
            });

            await item.setMeta(newFields);
            const actual = await item.getMeta();

            expect(actual).toEqual(expected);
          });
        });

        describe('removeValue', () => {
          it('should remove the key from storage', async () => {
            const item = storage.defineItem(`${storageArea}:count`);
            await fakeBrowser.storage[storageArea].set({ count: 456 });

            await item.removeValue();
            const actual = await item.getValue();

            expect(actual).toBeNull();
          });

          it('should not remove the metadata by default', async () => {
            const item = storage.defineItem(`${storageArea}:count`);
            const expected = { v: 1 };
            await fakeBrowser.storage[storageArea].set({
              count$: expected,
              count: 3,
            });

            await item.removeValue();
            const actual = await item.getMeta();

            expect(actual).toEqual(expected);
          });

          it('should remove the metadata when requested', async () => {
            const item = storage.defineItem(`${storageArea}:count`);
            await fakeBrowser.storage[storageArea].set({
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
            const item = storage.defineItem<number, { v: number }>(
              `${storageArea}:count`,
            );
            await fakeBrowser.storage[storageArea].set({ count$: { v: 4 } });

            await item.removeMeta();
            const actual = await item.getMeta();

            expect(actual).toEqual({});
          });

          it('should only remove specific fields', async () => {
            const item = storage.defineItem<number, { v: number; d: number }>(
              `${storageArea}:count`,
            );
            await fakeBrowser.storage[storageArea].set({
              count$: { v: 4, d: Date.now() },
            });

            await item.removeMeta(['d']);
            const actual = await item.getMeta();

            expect(actual).toEqual({ v: 4 });
          });
        });

        describe('watch', () => {
          it("should not trigger if the changed key is different from the item's key", async () => {
            const item = storage.defineItem(`${storageArea}:key`);
            const cb = vi.fn();

            item.watch(cb);
            await storage.setItem(`${storageArea}:not-the-key`, '123');

            expect(cb).not.toBeCalled();
          });

          it("should not trigger if the value doesn't change", async () => {
            const item = storage.defineItem(`${storageArea}:key`);
            const cb = vi.fn();
            const value = '123';

            await item.setValue(value);
            item.watch(cb);
            await item.setValue(value);

            expect(cb).not.toBeCalled();
          });

          it('should call the callback when the value changes', async () => {
            const item = storage.defineItem(`${storageArea}:key`);
            const cb = vi.fn();
            const newValue = '123';
            const oldValue = null;

            item.watch(cb);
            await item.setValue(newValue);

            expect(cb).toBeCalledTimes(1);
            expect(cb).toBeCalledWith(newValue, oldValue);
          });

          it('should remove the listener when calling the returned function', async () => {
            const item = storage.defineItem(`${storageArea}:key`);
            const cb = vi.fn();

            const unwatch = item.watch(cb);
            unwatch();
            await item.setValue('123');

            expect(cb).not.toBeCalled();
          });
        });

        describe('unwatch', () => {
          it('should remove all watch listeners', async () => {
            const item = storage.defineItem(`${storageArea}:key`);
            const cb = vi.fn();

            item.watch(cb);
            storage.unwatch();
            await item.setValue('123');

            expect(cb).not.toBeCalled();
          });
        });
      });
    },
  );
});
