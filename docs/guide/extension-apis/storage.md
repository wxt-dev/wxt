---
outline: deep
---

# Storage API

WXT provides a simplified API to replace the `browser.storage.*` APIs. Use the `storage` auto-import from `wxt/storage` or import it manually to get started:

```ts
import { storage } from 'wxt/storage';
```

:::warning
To use the `wxt/storage` API, the `"storage"` permission must be added to the manifest:

```ts
// wxt.config.ts
export default defineConfig({
  manifest: {
    permissions: ['storage'],
  },
});
```

More info on permissions [here](/guide/key-concepts/manifest#permissions).
:::

[[toc]]

## Basic Usage

All storage keys must be prefixed by their storage area.

```ts
// ❌ This will throw an error
await storage.getItem('installDate');

// ✅ This is good
await storage.getItem('local:installDate');
```

You can use `local:`, `session:`, `sync:`, or `managed:`.

If you use TypeScript, you can add a type parameter to most methods to specify the expected type of the key's value:

```ts
await storage.getItem<number>('local:installDate');
await storage.watch<number>(
  'local:installDate',
  (newInstallDate, oldInstallDate) => {
    // ...
  },
);
await storage.getMeta<{ v: number }>('local:installDate');
```

For a full list of methods available, see the [API reference](/api/reference/wxt/storage/interfaces/WxtStorage).

## Watchers

To listen for storage changes, use the `storage.watch` function. It lets you set up a listener for a single key or multiple keys:

```ts
// Watch a single key
const unwatch = storage.watch<number>('local:counter', (newCount, oldCount) => {
  console.log('Count changed:', { newCount, oldCount });
});

// Watch multiple keys
const unwatchMultiple = storage.watch({
  'local:counter1': (newCount1, oldCount1) => {
    console.log('Counter 1 changed:', { newCount1, oldCount1 });
  },
  'local:counter2': (newCount2, oldCount2) => {
    console.log('Counter 2 changed:', { newCount2, oldCount2 });
  },
});
```

To remove the listener, call the returned `unwatch` function:

```ts
const unwatch = storage.watch(...);

// Some time later...
unwatch();
```

## Metadata

`wxt/storage` also supports setting metadata for keys, stored at `key + "$"`. Metadata is a collection of properties associated with a key. It might be a version number, last modified date, etc.

[Other than versioning](#versioning), you are responsible for managing a field's metadata:

```ts
await Promise.all([
  storage.setItem('local:preference', true),
  storage.setMeta('local:preference', { lastModified: Date.now() }),
]);
```

When setting different properties of metadata from multiple calls, the properties are combined instead of overwritten:

```ts
await storage.setMeta('local:preference', { lastModified: Date.now() });
await storage.setMeta('local:preference', { v: 2 });

await storage.getMeta('local:preference'); // { v: 2, lastModified: 1703690746007 }
```

You can remove all metadata associated with a key, or just specific properties:

```ts
// Remove all properties
await storage.removeMeta('local:preference');

// Remove only the "lastModified" property
await storage.removeMeta('local:preference', 'lastModified');

// Remove multiple properties
await storage.removeMeta('local:preference', ['lastModified', 'v']);
```

## Defining Storage Items

Writing the key and type parameter for the same key over and over again can be annoying. As an alternative, you can use `storage.defineItem` to create a "storage item".

Storage items contain the same APIs as the `storage` variable, but you can configure its type, default value, and more in a single place:

```ts
// utils/storage.ts
const showChangelogOnUpdate = storage.defineItem<boolean>(
  'local:showChangelogOnUpdate',
  {
    fallback: true,
  },
);
```

Now, instead of using the `storage` variable, you can use the helper functions on the storage item you created:

```ts
await showChangelogOnUpdate.getValue();
await showChangelogOnUpdate.setValue(false);
await showChangelogOnUpdate.removeValue();
const unwatch = showChangelogOnUpdate.watch((newValue) => {
  // ...
});
```

For a full list of properties and methods available, see the [API reference](/api/reference/wxt/storage/interfaces/WxtStorageItem).

### Bulk Operations on Storage Items

When dealing with multiple storage items, you can perform bulk operations to improve performance by reducing the number of individual storage calls. The `storage` API provides several methods to handle bulk operations on defined storage items:

- **`getItems`**: Retrieve values of multiple storage items or keys.
- **`getItemMetas`**: Retrieve metadata for multiple storage items.
- **`setItemValues`**: Set values for multiple storage items.
- **`setItemMetas`**: Update metadata for multiple storage items.
- **`removeItems`**: Remove values (and optionally metadata) of multiple storage items.

#### Getting Values of Multiple Storage Items or Keys

You can retrieve the values of multiple storage items or keys in a single call using `getItems`:

```ts
const item1 = storage.defineItem<string>('local:item1', {
  fallback: 'default1',
});
const item2 = storage.defineItem<number>('local:item2', { fallback: 0 });
const item3 = storage.defineItem<boolean>('local:item3', { fallback: false });

// Using defined storage items
const values = await storage.getItems([item1, item2, item3]);

console.log(values);
// Output:
// [
//   { key: 'local:item1', value: 'default1' },
//   { key: 'local:item2', value: 0 },
//   { key: 'local:item3', value: false }
// ]

// Using keys directly
const keyValues = await storage.getItems([
  'local:item1',
  'local:item2',
  'local:item3',
]);

console.log(keyValues);
// Output:
// [
//   { key: 'local:item1', value: 'default1' },
//   { key: 'local:item2', value: 0 },
//   { key: 'local:item3', value: false }
// ]
```

The `getItems` function can handle both storage items and direct keys. It returns an array of key-value pairs.

#### Getting Metadata of Multiple Storage Items

Similarly, you can retrieve the metadata of multiple storage items using `getItemMetas`:

```ts
const metas = await storage.getItemMetas({ item1, item2, item3 });

console.log(metas);
// Output:
// [
//   { key: 'item1', value: { ...metadata of item1 } },
//   { key: 'item2', value: { ...metadata of item2 } },
//   { key: 'item3', value: { ...metadata of item3 } }
// ]
```

#### Setting Values of Multiple Storage Items

You can set values for multiple storage items in a single operation using `setItemValues`:

```ts
await storage.setItemValues(
  { item1, item2, item3 },
  { item1: 'new value', item2: 42, item3: true },
);
```

#### Setting Metadata of Multiple Storage Items

To update metadata for multiple storage items, use `setItemMetas`. Similar to `setMeta`, this overwrites the provided metadata keys for each item, leaving others untouched:

```ts
await storage.setItemMetas(
  { item1, item2 },
  {
    item1: { lastModified: Date.now() },
    item2: { version: 2 },
  },
);
```

#### Removing Values of Multiple Storage Items

You can remove the values (and optionally metadata) of multiple storage items efficiently using `removeItems`:

```ts
await storage.removeItems([
  item1,
  item2,
  { key: 'local:item3', options: { removeMeta: true } },
]);
```

### Versioning

You can add versioning to storage items if you expect them to grow or change over time. When defining the first version of an item, start with version 1.

For example, consider a storage item that stores a list of websites that are ignored by an extension.

:::code-group

```ts [v1]
type IgnoredWebsiteV1 = string;

export const ignoredWebsites = storage.defineItem<IgnoredWebsiteV1[]>(
  'local:ignoredWebsites',
  {
    fallback: [],
    version: 1,
  },
);
```

<!-- prettier-ignore -->
```ts [v2]
import { nanoid } from 'nanoid'; // [!code ++]

type IgnoredWebsiteV1 = string;
interface IgnoredWebsiteV2 { // [!code ++]
  id: string; // [!code ++]
  website: string; // [!code ++]
} // [!code ++]

export const ignoredWebsites = storage.defineItem<IgnoredWebsiteV1[]>( // [!code --]
export const ignoredWebsites = storage.defineItem<IgnoredWebsiteV2[]>( // [!code ++]
  'local:ignoredWebsites',
  {
    fallback: [],
    version: 1, // [!code --]
    version: 2, // [!code ++]
    migrations: { // [!code ++]
      // Ran when migrating from v1 to v2 // [!code ++]
      2: (websites: IgnoredWebsiteV1[]): IgnoredWebsiteV2[] => { // [!code ++]
        return websites.map((website) => ({ id: nanoid(), website })); // [!code ++]
      }, // [!code ++]
    }, // [!code ++]
  },
);
```

<!-- prettier-ignore -->
```ts [v3]
import { nanoid } from 'nanoid';

type IgnoredWebsiteV1 = string;
interface IgnoredWebsiteV2 {
  id: string;
  website: string;
}
interface IgnoredWebsiteV3 { // [!code ++]
  id: string; // [!code ++]
  website: string; // [!code ++]
  enabled: boolean; // [!code ++]
} // [!code ++]

export const ignoredWebsites = storage.defineItem<IgnoredWebsiteV2[]>( // [!code --]
export const ignoredWebsites = storage.defineItem<IgnoredWebsiteV3[]>( // [!code ++]
  'local:ignoredWebsites',
  {
    fallback: [],
    version: 2, // [!code --]
    version: 3, // [!code ++]
    migrations: {
      // Ran when migrating from v1 to v2
      2: (websites: IgnoredWebsiteV1[]): IgnoredWebsiteV2[] => {
        return websites.map((website) => ({ id: nanoid(), website }));
      },
      // Ran when migrating from v2 to v3 // [!code ++]
      3: (websites: IgnoredWebsiteV2[]): IgnoredWebsiteV3[] => { // [!code ++]
        return websites.map((website) => ({ ...website, enabled: true })); // [!code ++]
      }, // [!code ++]
    },
  },
);
```

:::

:::info
Internally, this uses a metadata property called `v` to track the value's current version.
:::

In this case, we thought that the ignored website list might change in the future, and were able to set up a versioned storage item from the start.

Realistically, you won't know an item needs versioning until you need to change its schema. Thankfully, it's simple to add versioning to an unversioned storage item.

When a previous version isn't found, WXT assumes the version was `1`. That means you just need to set `version: 2` and add a migration for `2`, and it will just work!

Let's look at the same ignored websites example from before, but start with an unversioned item this time:

:::code-group

```ts [Unversioned]
export const ignoredWebsites = storage.defineItem<string[]>(
  'local:ignoredWebsites',
  {
    fallback: [],
  },
);
```

<!-- prettier-ignore -->
```ts [v2]
import { nanoid } from 'nanoid'; // [!code ++]

// Retroactively add a type for the first version // [!code ++]
type IgnoredWebsiteV1 = string; // [!code ++]
interface IgnoredWebsiteV2 { // [!code ++]
  id: string; // [!code ++]
  website: string; // [!code ++]
} // [!code ++]

export const ignoredWebsites = storage.defineItem<string[]>( // [!code --]
export const ignoredWebsites = storage.defineItem<IgnoredWebsiteV2[]>( // [!code ++]
  'local:ignoredWebsites',
  {
    fallback: [],
    version: 2, // [!code ++]
    migrations: { // [!code ++]
      // Ran when migrating from v1 to v2 // [!code ++]
      2: (websites: IgnoredWebsiteV1[]): IgnoredWebsiteV2[] => { // [!code ++]
        return websites.map((website) => ({ id: nanoid(), website })); // [!code ++]
      }, // [!code ++]
    }, // [!code ++]
  },
);
```

:::

### Running Migrations

As soon as `storage.defineItem` is called, WXT checks if migrations need to be run, and if so, runs them. Calls to get or update the storage item's value or metadata (`getValue`, `setValue`, `removeValue`, `getMeta`, etc.) will automatically wait for the migration process to finish before actually reading or writing values.

### Default Values

With `storage.defineItem`, there are multiple ways of defining default values:

1. **`fallback`** - Return this value from `getValue` instead of `null` if the value is missing.

   This option is great for providing default values for settings:

   ```ts
   const theme = storage.defineItem('local:theme', {
     fallback: 'dark',
   });
   const allowEditing = storage.defineItem('local:allow-editing', {
     fallback: true,
   });
   ```

2. **`init`** - Initialize and save a value in storage if it is not already saved.

   This is great for values that need to be initialized or set once:

   ```ts
   const userId = storage.defineItem('local:user-id', {
     init: () => globalThis.crypto.randomUUID(),
   });
   const installDate = storage.defineItem('local:install-date', {
     init: () => new Date().getTime(),
   });
   ```

   The value is initialized in storage immediately.
