import { storage } from '~/storage.js';
import { beforeEach, describe, expect, test } from 'vitest';

describe.only('Repro', () => {
  const TEST_KEY1 = 'local:test1';

  beforeEach(async () => {
    await storage.removeItem(TEST_KEY1);
  });

  test('Why can not get defaultValue from storage?', async () => {
    // Define item
    const testDefItem = storage.defineItem(TEST_KEY1, {
      defaultValue: { name: 'bob' },
    });
    // Can get a default value from `testDefItem`
    expect(await testDefItem.getValue()).toStrictEqual({ name: 'bob' });
    // !! But can not get a default value from `storage`
    expect(await storage.getItem(TEST_KEY1)).toBe(null);
    // Set a value different from the default value
    await testDefItem.setValue({ name: 'john' });
    // Can get the new value from `storage`
    expect(await storage.getItem(TEST_KEY1)).toStrictEqual({ name: 'john' });
  });

  test('Could not get default value but can set.', async () => {
    // Define item
    const testDefItem = storage.defineItem(TEST_KEY1, {
      defaultValue: { name: 'nancy' },
    });
    // Check the default value
    expect(await testDefItem.getValue()).toStrictEqual({ name: 'nancy' });
    // !! In the above test, could not get a default value, but can set a value.
    await storage.setItem(TEST_KEY1, { name: 'can change' });
    // Can get the changed value from storage
    expect(await testDefItem.getValue()).toStrictEqual({ name: 'can change' });
    // Can get the same value from `storage`
    expect(await storage.getItem(TEST_KEY1)).toStrictEqual({
      name: 'can change',
    });
  });
});
