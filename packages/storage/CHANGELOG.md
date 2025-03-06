# Changelog

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

- Ergou <ma2808203259@hotmail.com>
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