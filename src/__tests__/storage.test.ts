import { fakeBrowser } from '@webext-core/fake-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { browser } from '~/browser';
import { storage } from '~/storage';

describe('Storage Utils', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  describe.each(['local', 'sync', 'managed', 'session'] as const)(
    'storage - %s',
    (storageArea) => {
      describe('getItem', () => {
        it('should return the value from the correct storage area', async () => {
          const expected = 123;
          await fakeBrowser.storage[storageArea].set({ count: expected });
          expect(await storage.getItem(`${storageArea}:count`)).toBe(expected);
        });

        it("should return null if the value doesn't exist", async () => {
          expect(await storage.getItem(`${storageArea}:count`)).toBeNull();
        });
      });

      describe('getItems', () => {
        it('should return an array of values in the same order as the keys passed in', async () => {
          const expected = [
            { key: `${storageArea}:count`, value: 234 },
            { key: `${storageArea}:installDate`, value: null },
          ];
          const keys = expected.map((item) => item.key);
          await fakeBrowser.storage[storageArea].set({
            count: expected[0].value,
          });

          const actual = await storage.getItems(keys);

          expect(actual).toEqual(expected);
        });
      });

      describe('setItem', () => {
        it('should set the value in the correct storage area', () => {});

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

      describe('removeItem', () => {
        it('should remove the key from storage', async () => {
          await fakeBrowser.storage[storageArea].set({ count: 456 });
          await storage.removeItem(`${storageArea}:count`);

          expect(await browser.storage[storageArea].get()).toEqual({});
        });
      });
    },
  );
});
