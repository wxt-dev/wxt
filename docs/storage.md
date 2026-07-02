---
outline: deep
---

# WXT Storage

[Changelog](https://github.com/wxt-dev/wxt/blob/main/packages/wxt/CHANGELOG.md) &bull; [API Reference](/api/reference/wxt/utils/storage/interfaces/WxtStorage)

A simplified wrapper around the extension storage APIs.

## Installation

### With WXT

This module is built-in to WXT, so you don't need to install anything.

```ts
import { storage } from '#imports';
```

If you use auto-imports, `storage` is auto-imported for you, so you don't even need to import it!

### Without WXT

Install the NPM package:

```sh
npm i @wxt-dev/storage
pnpm add @wxt-dev/storage
yarn add @wxt-dev/storage
bun add @wxt-dev/storage
```

```ts
import { storage } from '@wxt-dev/storage';
```

## Storage Permission

To use the `@wxt-dev/storage` API, the `"storage"` permission must be added to the manifest:

```ts [wxt.config.ts]
export default defineConfig({
  manifest: {
    permissions: ['storage'],
  },
});
```

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

> This approach is fine for one-off storage fields or generic helpers, but [defining storage items](#defining-storage-items) is the recommended way to add type-safety.

## Watchers

To listen for storage changes, use the `storage.watch` function. It lets you set up a listener for a single key:

```ts
const unwatch = storage.watch<number>('local:counter', (newCount, oldCount) => {
  console.log('Count changed:', { newCount, oldCount });
});
```

To remove the listener, call the returned `unwatch` function:

```ts
const unwatch = storage.watch(...);

// Some time later...
unwatch();
```

## Metadata

`@wxt-dev/storage` also supports setting metadata for keys, stored at `key + "$"`. Metadata is a collection of properties associated with a key. It might be a version number, last modified date, etc.

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

Now, instead of using the `storage` variable, you can use the storage item instead:

```ts
await showChangelogOnUpdate.getValue();
await showChangelogOnUpdate.setValue(false);
await showChangelogOnUpdate.removeValue();
const unwatch = showChangelogOnUpdate.watch((newValue) => {
  // ...
});
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

### Schema Validation

Attach a [Standard Schema](https://standardschema.dev/) validator to a storage item so every read and write is checked against a schema at runtime. Any Standard Schema-conformant validator works out of the box: [Zod](https://zod.dev), [Valibot](https://valibot.dev), [ArkType](https://arktype.io), [Effect Schema](https://effect.website/docs/schema/introduction/), and others.

```ts
import { z } from 'zod';

const theme = storage.defineItem('local:theme', {
  schema: z.enum(['light', 'dark', 'system']),
  fallback: 'system',
});

// Type of getValue() is inferred from the schema.
const value = await theme.getValue(); // 'light' | 'dark' | 'system'
```

**Validator cookbook**

All four examples below define the same three-variant theme item. `TValue` is inferred from `StandardSchemaV1.InferOutput<TSchema>` — no manual generic needed.

```ts
// Zod
import { z } from 'zod';
const theme = storage.defineItem('local:theme', {
  schema: z.enum(['light', 'dark', 'system']),
  fallback: 'system',
});

// Valibot
import * as v from 'valibot';
const theme = storage.defineItem('local:theme', {
  schema: v.picklist(['light', 'dark', 'system']),
  fallback: 'system',
});

// ArkType
import { type } from 'arktype';
const theme = storage.defineItem('local:theme', {
  schema: type("'light' | 'dark' | 'system'"),
  fallback: 'system',
});

// Effect Schema
import { Schema } from 'effect';
const theme = storage.defineItem('local:theme', {
  schema: Schema.standardSchemaV1(Schema.Literal('light', 'dark', 'system')),
  fallback: 'system',
});
```

**Pipelines**

- On read: `raw → migrate → serializer.read? → schema.validate → T`
- On write: `T → schema.validate → serializer.write? → raw`

**Handling validation failures on read**

Writes always throw a `SchemaError` on validation failure. Reads (including `watch` callbacks) respect the `onValidationError` option:

```ts
const theme = storage.defineItem('local:theme', {
  schema: z.enum(['light', 'dark', 'system']),
  fallback: 'system',
  onValidationError: 'fallback', // 'throw' | 'fallback' | 'reset' | callback
});
```

- `'throw'` (default): throw a `SchemaError` with the schema's issues.
- `'fallback'`: return `fallback` (or `null` if none set); leave the invalid value in storage.
- `'reset'`: clear the invalid value from storage and return `fallback`.
- `(issues, raw) => T`: custom recovery — the returned value becomes the read result; not written back.

### Custom Serialization

`chrome.storage` only accepts JSON-serializable values. To store types like `Set`, `Map`, or `Date`, provide a `serializer` with `write` (required) and `read` (optional):

```ts
const enabledSites = storage.defineItem<Set<string>>('local:enabled-sites', {
  serializer: {
    write: (set) => [...set],
    read: (raw) => (Array.isArray(raw) ? new Set(raw as string[]) : new Set()),
  },
});
```

When paired with a coercing schema like `z.coerce.date()`, `read` can be omitted — the schema handles deserialization:

```ts
const installDate = storage.defineItem('local:install-date', {
  schema: z.coerce.date(),
  serializer: { write: (d) => d.toISOString() },
});
```

### Non-Standard-Schema Validators

For validators that aren't Standard Schema-conformant — e.g. [TypeBox](https://github.com/sinclairzx81/typebox) (`Value.Parse`), [io-ts](https://gcanti.github.io/io-ts/) (`.decode`), or hand-rolled parsers — wrap them with `defineSchema`:

```ts
import { defineSchema } from '@wxt-dev/storage';
import { storage } from '#imports';
import { Type, Value } from '@sinclair/typebox';

const Theme = Type.Union([Type.Literal('light'), Type.Literal('dark')]);

const theme = storage.defineItem('local:theme', {
  schema: defineSchema<'light' | 'dark'>((v) => Value.Parse(Theme, v)),
});
```

The wrapped function must return the parsed value on success or throw on failure. Both synchronous and async parsers are supported.

### Caveats

- **Transforming schemas** (e.g. `z.number().transform(n => n * 2)`) run on every read AND every write. Without an inverse `serializer.write`, storage will hold the transformed form and every subsequent read will re-transform. For non-idempotent transforms, pair the schema with a `serializer.write` that inverts the transform, or use validator-only schemas (`z.number()`).
- **Bulk operations** (`storage.getItems`, `storage.setItems`, `storage.getMetas`, `storage.setMetas`, `storage.removeItems`) bypass schema and serializer even when called with defined items. Use `item.getValue()` / `item.setValue()` directly when validation is required.
- **`onValidationError: 'reset'` in watch callbacks** is neutered — an invalid value delivered to a watch listener will not trigger a destructive `driver.removeItem`. This prevents the case where an invalid `oldValue` arriving alongside a freshly-written valid `newValue` would wipe the new value. Reset still applies to direct `getValue` reads.

## Bulk Operations

When getting or setting multiple values in storage, you can perform bulk operations to improve performance by reducing the number of individual storage calls. The `storage` API provides several methods for performing bulk operations:

- **`getItems`** - Get multiple values at once.
- **`getMetas`** - Get metadata for multiple items at once.
- **`setItems`** - Set multiple values at once.
- **`setMetas`** - Set metadata for multiple items at once.
- **`removeItems`** - Remove multiple values (and optionally metadata) at once.

All these APIs support both string keys and defined storage items:

```ts
const userId = storage.defineItem('local:userId');

await storage.setItems([
  { key: 'local:installDate', value: Date.now() },
  { item: userId, value: generateUserId() },
]);
```

Refer to the [API Reference](/api/reference/wxt/utils/storage/interfaces/WxtStorage) for types and examples of how to use all the bulk APIs.
