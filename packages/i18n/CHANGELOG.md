# Changelog

## v0.2.4

[compare changes](https://github.com/wxt-dev/wxt/compare/i18n-v0.2.3...i18n-v0.2.4)

### 🩹 Fixes

- Standardize locale codes and warn about unsupported ones ([#1617](https://github.com/wxt-dev/wxt/pull/1617))
- Use `@wxt-dev/browser` instead of `@types/chrome` ([#1645](https://github.com/wxt-dev/wxt/pull/1645))

### 📖 Documentation

- Add react language ID to README ([#1347](https://github.com/wxt-dev/wxt/pull/1347))
- Fix public path reference ([bcb20874](https://github.com/wxt-dev/wxt/commit/bcb20874))

### 🏡 Chore

- **deps:** Upgrade all non-major dependencies ([#1164](https://github.com/wxt-dev/wxt/pull/1164))
- **deps:** Bump dev and non-breaking major dependencies ([#1167](https://github.com/wxt-dev/wxt/pull/1167))
- Add funding links to `package.json` files ([#1446](https://github.com/wxt-dev/wxt/pull/1446))
- Use PNPM 10's new catelog feature ([#1493](https://github.com/wxt-dev/wxt/pull/1493))
- Move production dependencies to PNPM 10 catelog ([#1494](https://github.com/wxt-dev/wxt/pull/1494))
- Stop using PNPM catalog ([#1644](https://github.com/wxt-dev/wxt/pull/1644))
- Upgrade `@aklinker1/check` to v2 ([#1647](https://github.com/wxt-dev/wxt/pull/1647))
- Change browser workspace dependency to `^` ([c7335add](https://github.com/wxt-dev/wxt/commit/c7335add))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))
- Okinea Dev ([@okineadev](https://github.com/okineadev))
- Redwoodlid ([@redwoodlid](https://github.com/redwoodlid))

## v0.2.3

[compare changes](https://github.com/wxt-dev/wxt/compare/i18n-v0.2.2...i18n-v0.2.3)

### 🩹 Fixes

- Prevent app crashes from parse errors due to incomplete file saves ([#1114](https://github.com/wxt-dev/wxt/pull/1114))

### 📖 Documentation

- Cleanup typos and broken links ([bb5ea34](https://github.com/wxt-dev/wxt/commit/bb5ea34))

### ❤️ Contributors

- Bread Grocery <breadgrocery@gmail.com>
- Aaron ([@aklinker1](http://github.com/aklinker1))

## v0.2.2

[compare changes](https://github.com/wxt-dev/wxt/compare/i18n-v0.2.1...i18n-v0.2.2)

### 🚀 Enhancements

- Add support for configuring the `locales` directory ([#1109](https://github.com/wxt-dev/wxt/pull/1109))

### ❤️ Contributors

- Bread Grocery <breadgrocery@gmail.com>

## v0.2.1

[compare changes](https://github.com/wxt-dev/wxt/compare/i18n-v0.2.0...i18n-v0.2.1)

### 🩹 Fixes

- Add missing "type" keyword to type export in generated file ([22b5294](https://github.com/wxt-dev/wxt/commit/22b5294))

### 📖 Documentation

- Rewrite and restructure the documentation website ([#933](https://github.com/wxt-dev/wxt/pull/933))

### 🏡 Chore

- Fix typo in internal function name ([21894d2](https://github.com/wxt-dev/wxt/commit/21894d2))

### ❤️ Contributors

- Aaron ([@aklinker1](http://github.com/aklinker1))

## v0.2.0

[compare changes](https://github.com/wxt-dev/wxt/compare/i18n-v0.1.1...i18n-v0.2.0)

### 🩹 Fixes

- ⚠️  Remove invalid options argument ([#1048](https://github.com/wxt-dev/wxt/pull/1048))

To upgrade, if you were passing a final `options` argument, remove it. If you used the third argument to escape `<` symbol... You'll need to do it yourself:

```diff
- i18n.t("someKey", ["sub1"], { escapeLt: true });
+ i18n.t("someKey", ["sub1"]).replaceAll("<", "&lt;");
```

### ❤️ Contributors

- Aaron ([@aklinker1](http://github.com/aklinker1))

## v0.1.1

[compare changes](https://github.com/wxt-dev/wxt/compare/i18n-v0.1.0...i18n-v0.1.1)

### 🩹 Fixes

- Friendly error messages for `null` and `undefined` values inside message files ([#1041](https://github.com/wxt-dev/wxt/pull/1041))

### 🏡 Chore

- Add  `oxlint` for linting ([#947](https://github.com/wxt-dev/wxt/pull/947))
- Upgrade all non-major dependencies ([#1040](https://github.com/wxt-dev/wxt/pull/1040))

### ❤️ Contributors

- Windmillcode0 <shieldmousetower734@gmail.com>
- Aaron ([@aklinker1](http://github.com/aklinker1))