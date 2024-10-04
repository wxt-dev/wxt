# Changelog

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
