# Messages File Format

You can only use the file format discussed on this page if you have [integrated `@wxt-dev/i18n` into your build process](./build-integrations). If you have not integrated it into your build process, you must use JSON files in the `_locales` directory, like a normal web extension.

[[toc]]

## File Extensions

You can define your messages in several different file types:

- `.yml`
- `.yaml`
- `.json`
- `.jsonc`
- `.json5`
- `.toml`

## Nested Keys

You can have translations at the top level or nest them into groups:

```yml
ok: OK
cancel: Cancel
welcome:
  title: Welcome to XYZ
dialogs:
  confirmation:
    title: 'Are you sure?'
```

To access a nested key, use `.`:

```ts
i18n.t('ok'); // "OK"
i18n.t('cancel'); // "Cancel"
i18n.t('welcome.title'); // "Welcome to XYZ"
i18n.t('dialogs.confirmation.title'); // "Are you sure?"
```

## Substitutions

Because `@wxt-dev/i18n` is based on `browser.i18n`, you define substitutions the same way, with `$1`-`$9`:

```yml
hello: Hello $1!
order: Thanks for ordering your $1
```

### Escapting `$`

To escape the dollar sign, put another `$` in front of it:

```yml
dollars: $$$1
```

```ts
i18n.t('dollars', ['1.00']); // "$1.00"
```

## Plural Forms

:::warning
Plural support languages like Arabic, that have different forms for "few" or "many", is not supported right now. Feel free to open a PR if you are interested in this!
:::

To get a different translation based on a count:

```yml
items:
  1: 1 item
  n: $1 items
```

Then you pass in the count as the second argument to `i18n.t`:

```ts
i18n.t('items', 0); // "0 items"
i18n.t('items', 1); // "1 item"
i18n.t('items', 2); // "2 items"
```

To add a custom translation for 0 items:

```yml
items:
  0: No items
  1: 1 item
  n: $1 items
```

```ts
i18n.t('items', 0); // "No items"
i18n.t('items', 1); // "1 item"
i18n.t('items', 2); // "2 items"
```

If you need to pass a custom substitution for `$1` instead of the count, just add the substitution:

```yml
items:
  0: No items
  1: $1 item
  n: $1 items
```

```ts
i18n.t('items', 0, ['Zero']); // "No items"
i18n.t('items', 1, ['One']); // "One item"
i18n.t('items', 2, ['Multiple']); // "Multiple items"
```

## Verbose Keys

`@wxt-dev/i18n` is compatible with the message format used by [`browser.i18n`](https://developer.chrome.com/docs/extensions/reference/api/i18n).

:::info
This means if you're migrating to `@wxt-dev/i18n` and you're already using the verbose format, you don't have to change anything!
:::

A key is treated as "verbose" when it is:

1. At the top level (not nested)
2. Only contains the following properties: `message`, `description` and/or `placeholder`

:::code-group

```json [JSON]
{
  "appName": {
    "message": "GitHub - Better Line Counts",
    "description": "The app's name, should not be translated",
  },
  "ok": "OK",
  "deleteConfirmation": {
    "title": "Delete XYZ?"
    "message": "You cannot undo this action once taken."
  }
}
```

```yml [YAML]
appName:
  message: GitHub - Better Line Counts
  description: The app's name, should not be translated
ok: OK
deleteConfirmation:
  title: Delete XYZ?
  message: You cannot undo this action once taken.
```

:::

In this example, only `appName` is considered verbose. `deleteConfirmation` is not verbose because it contains the additional property `title`.

```ts
i18n.t('appName'); // ✅ "GitHub - Better Line Counts"
i18n.t('appName.message'); // ❌
i18n.t('ok'); // ✅ "OK"
i18n.t('deleteConfirmation'); // ❌
i18n.t('deleteConfirmation.title'); // ✅ "Delete XYZ?"
i18n.t('deleteConfirmation.message'); // ✅ "You cannot undo this action once taken."
```

If this is confusing, don't worry! With type-safety, you'll get a type error if you do it wrong. If type-safety is disabled, you'll get a runtime warning in the devtools console.

:::warning
Using the verbose format is not recommended. I have yet to see a translation service and software that supports this format out of the box. Stick with the simple format when you can.
:::
