# Changelog

## v1.2.0

[compare changes](https://github.com/wxt-dev/wxt/compare/storage-v1.1.1...storage-v1.2.0)

### 🚀 Enhancements

- **storage:** Add `onMigrationComplete` callback ([#1514](https://github.com/wxt-dev/wxt/pull/1514))
- **storage:** Add `debug` option to enable migration logs ([#1513](https://github.com/wxt-dev/wxt/pull/1513))

### 🩹 Fixes

- Fix typescript error on `defineItem` fallback ([#1601](https://github.com/wxt-dev/wxt/pull/1601))
- Use `@wxt-dev/browser` instead of `@types/chrome` ([#1645](https://github.com/wxt-dev/wxt/pull/1645))

### 🏡 Chore

- **deps:** Update all dependencies ([#1568](https://github.com/wxt-dev/wxt/pull/1568))
- Stop using PNPM catalog ([#1644](https://github.com/wxt-dev/wxt/pull/1644))
- Upgrade `@aklinker1/check` to v2 ([#1647](https://github.com/wxt-dev/wxt/pull/1647))
- Change browser workspace dependency to `^` ([c7335add](https://github.com/wxt-dev/wxt/commit/c7335add))
- **deps:** Upgrade oxlint from 0.16.8 to 1.14.0 ([a01928e0](https://github.com/wxt-dev/wxt/commit/a01928e0))
- **deps:** Upgrade typescript from 5.8.3 to 5.9.2 ([a6eef643](https://github.com/wxt-dev/wxt/commit/a6eef643))
- Create script for managing dependency upgrades ([#1875](https://github.com/wxt-dev/wxt/pull/1875))
- **deps:** Upgrade all dev dependencies ([#1876](https://github.com/wxt-dev/wxt/pull/1876))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))
- Anh71me ([@iyume](https://github.com/iyume))
- Ergou <ma2808203259@hotmail.com>

## v1.1.1

[compare changes](https://github.com/wxt-dev/wxt/compare/storage-v1.1.0...storage-v1.1.1)

### 🩹 Fixes

- Return early if no migration is needed ([#1502](https://github.com/wxt-dev/wxt/pull/1502))

### 🏡 Chore

- Add funding links to `package.json` files ([#1446](https://github.com/wxt-dev/wxt/pull/1446))
- Use PNPM 10's new catelog feature ([#1493](https://github.com/wxt-dev/wxt/pull/1493))
- Move production dependencies to PNPM 10 catelog ([#1494](https://github.com/wxt-dev/wxt/pull/1494))
- **deps:** Upgrade to Vite 6 and related dependencies ([#1496](https://github.com/wxt-dev/wxt/pull/1496))

### ❤️ Contributors

- ergou ([@RayGuo-ergou](https://github.com/RayGuo-ergou))
- Aaron ([@aklinker1](http://github.com/aklinker1))
- Okinea Dev ([@okineadev](http://github.com/okineadev))

## v1.1.0

[compare changes](https://github.com/wxt-dev/wxt/compare/storage-v1.0.1...storage-v1.1.0)

### 🚀 Enhancements

- Add `storage.clear` ([#1368](https://github.com/wxt-dev/wxt/pull/1368))

### 📖 Documentation

- Update link ([654a54a](https://github.com/wxt-dev/wxt/commit/654a54a))

### ❤️ Contributors

- Chengxi ([@chengxilo](http://github.com/chengxilo))
- Aaron ([@aklinker1](http://github.com/aklinker1))

## v1.0.1

[compare changes](https://github.com/wxt-dev/wxt/compare/storage-v1.0.0...storage-v1.0.1)

### 🩹 Fixes

- Use `browser` for mv2 storage ([#1200](https://github.com/wxt-dev/wxt/pull/1200))

### 📖 Documentation

- Cleanup changelog ([f5b7f7e](https://github.com/wxt-dev/wxt/commit/f5b7f7e))

### 🏡 Chore

- Init changelog for storage package ([6fc227b](https://github.com/wxt-dev/wxt/commit/6fc227b))

### ❤️ Contributors

- Aaron ([@aklinker1](http://github.com/aklinker1))

## v1.0.0

Extracted `wxt/storage` into it's own package, `@wxt-dev/storage`!

It's still shipped inside WXT and accessible via `wxt/storage`, but now:

- Non-WXT projects can use the storage wrapper.
- We can make breaking changes to the API separately.

[Read the docs](https://wxt.dev/storage.html) for more details.

> This is apart of the v1.0 initiative for WXT.