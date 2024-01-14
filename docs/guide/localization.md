---
outline: deep
---

# Localization

WXT includes a util, [`i18n`](/api/wxt/i18n/), that provides a type-safe feature-rich alternative to `browser.i18n.getMessage`.

It is available automatically when you create a messages file under the `locales/` directory, and add a `default_locale` to the manifest:

```
<srcDir>
└─ locales/
   ├─ en.json
   ├─ es.json5
   ├─ fr.yml
   ├─ de.yaml
   └─ ...
```

> You can use JSON, JSON5, or YAML formats.

```ts
// wxt.config.ts
export default defineConfig({
  manifest: {
    default_locale: 'en',
  },
});
```

## Message File Format

```yml
# Use plain strings
simpleMessage: Hello world!

# Nest strings in objects
popup:
  overview:
    title: Nested text

# Plural form support
items:
  1: 1 item
  n: $1 items
# Optionally include a custom string for 0
cartSize:
  0: Empty
  1: 1 item
  n: $1 items

# Or stick with the standard web extension format (with a message, description, and placeholders)
manifestMessage:
  message: $THIS$ is translated
  description: This is not-translated, helps translators
  placeholder:
    this:
      content: This
```

:::tip
`locales/<code>.json` is 100% compatible with the standard web extension localization format (`_locales/<code>/messages.json`). If you have existing messages files, just move them into the `locales/` directory.
:::

## Usage

`i18n` is auto-imported, but can be manually imported from `wxt/i18n`.

```ts
import { i18n } from 'wxt/i18n';
```

### Basic Usage

You can access messages by their name:

```yml
helloWorld: Hello world!
```

```ts
i18n.t('helloWorld'); // "Hello world!"
```

Nested messages are combined into one string using an `_`.

```yml
popup:
  overview:
    title: Hello world!
```

```ts
i18n.t('popup_overview_title'); // "Hello world!"
```

If a message is in the standard web extension format, don't include a `_message`, even if it's nested.

```yml
helloWorld:
  message: Hello world!
  description: Some description
popup:
  overview:
    title:
      message: Nested Title
```

```ts
i18n.t('helloWorld'); // "Hello world!"
i18n.t('popup_overview_title'); // "Nested Title"
```

### Substitutions

To insert a custom string into a translation, pass an array of values as the second parameter of the `i18n.t` function:

```yml
hello: Hello, $1, my name is $2.
```

```ts
i18n.t('hello', ['Aaron', 'Mark']); // "Hello Aaron, my name is Mark."
```

### Plural Form

When getting the translation for text with a plural form, use the `i18n.tp` function.

```yml
friends:
  0: I have no friends.
  1: I have a friend.
  n: I have many friends.
```

```ts
i18n.tp('friends', 0); // "I have no friends."
i18n.tp('friends', 1); // "I have one friend."
i18n.tp('friends', 2); // "I have many friends."
```

The first number is the `count`. It is what decides which form will be used.

Substitutions are not required. But usually, a plural form will look something like this:

```yml
items:
  1: 1 item
  n: $1 items
```

```ts
i18n.tp('items', 0, ['0']); // "0 items"
i18n.tp('items', 1, ['1']); // "1 item"
i18n.tp('items', 2, ['2']); // "2 items"
i18n.tp('items', 3, ['3']); // "3 items"
```
