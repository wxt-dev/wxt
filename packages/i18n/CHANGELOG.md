# Changelog

## v0.2.6

[compare changes](https://github.com/wxt-dev/wxt/compare/i18n-v0.2.5...i18n-v0.2.6)

### 🚀 Enhancements

- Add named substitutions to i18n ([#2440](https://github.com/wxt-dev/wxt/pull/2440))

### 🏡 Chore

- Add `prettier-plugin-jsdoc` to project ([#2171](https://github.com/wxt-dev/wxt/pull/2171))
- Replace fast-glob and ora with lighter alternatives ([#2173](https://github.com/wxt-dev/wxt/pull/2173))
- **deps:** Upgrade deps ([#2175](https://github.com/wxt-dev/wxt/pull/2175))
- Add prepack script to all packages ([032f7931](https://github.com/wxt-dev/wxt/commit/032f7931))
- Remove `any` from `i18n`'s internal types ([#2201](https://github.com/wxt-dev/wxt/pull/2201))
- Add cspell and fix all typos ([6621aaf8](https://github.com/wxt-dev/wxt/commit/6621aaf8))
- Migrate monorepo to use Bun instead of PNPM ([#2009](https://github.com/wxt-dev/wxt/pull/2009))
- Add new types for i18n ([#2121](https://github.com/wxt-dev/wxt/pull/2121))
- **deps-dev:** Bump typescript from 5.9.3 to 6.0.3 ([#2325](https://github.com/wxt-dev/wxt/pull/2325))
- **deps-dev:** Bump oxlint from 1.59.0 to 1.63.0 ([#2356](https://github.com/wxt-dev/wxt/pull/2356))
- Use `catalog:` for dev dependencies ([#2357](https://github.com/wxt-dev/wxt/pull/2357))
- **deps:** Bump tinyglobby from 0.2.15 to 0.2.16 ([#2366](https://github.com/wxt-dev/wxt/pull/2366))
- Add benchmarks for i18n vs vanilla usage ([#2372](https://github.com/wxt-dev/wxt/pull/2372))

### ❤️ Contributors

- T ([@cookesan](https://github.com/cookesan))
- Aaron ([@aklinker1](https://github.com/aklinker1))
- Patryk Kuniczak ([@PatrykKuniczak](https://github.com/PatrykKuniczak))
- Florian Metz ([@Timeraa](https://github.com/Timeraa))

## v0.2.5

[compare changes](https://github.com/wxt-dev/wxt/compare/i18n-v0.2.4...i18n-v0.2.5)

### 🩹 Fixes

- Add `.jsonc` support for locale files to match docs ([#2066](https://github.com/wxt-dev/wxt/pull/2066))

### 🏡 Chore

- Manually fix markdownlint errors ([#1711](https://github.com/wxt-dev/wxt/pull/1711))
- **deps:** Upgrade oxlint from 0.16.8 to 1.14.0 ([a01928e0](https://github.com/wxt-dev/wxt/commit/a01928e0))
- **deps:** Upgrade typescript from 5.8.3 to 5.9.2 ([a6eef643](https://github.com/wxt-dev/wxt/commit/a6eef643))
- Create script for managing dependency upgrades ([#1875](https://github.com/wxt-dev/wxt/pull/1875))
- **deps:** Upgrade all dev dependencies ([#1876](https://github.com/wxt-dev/wxt/pull/1876))
- Upgrade dev and non-major prod dependencies ([#2000](https://github.com/wxt-dev/wxt/pull/2000))
- Use `tsdown` to build packages ([#2006](https://github.com/wxt-dev/wxt/pull/2006))
- Move script-only dev dependencies to top-level `package.json` ([#2007](https://github.com/wxt-dev/wxt/pull/2007))
- Update dependencies ([#2069](https://github.com/wxt-dev/wxt/pull/2069))
- Upgrade major deps ([#2070](https://github.com/wxt-dev/wxt/pull/2070))

### ❤️ Contributors

- Ilya Kubariev ([@gymnasy55](https://github.com/gymnasy55))
- Aaron ([@aklinker1](https://github.com/aklinker1))

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