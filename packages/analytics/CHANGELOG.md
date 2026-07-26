# Changelog

## v0.5.5

[compare changes](https://github.com/wxt-dev/wxt/compare/analytics-v0.5.4...analytics-v0.5.5)

### 🚀 Enhancements

- **analytics:** Add Moderok analytics provider ([#2393](https://github.com/wxt-dev/wxt/pull/2393))

### 🩹 Fixes

- **analytics:** Change method return types from void to Promise<void> ([#2409](https://github.com/wxt-dev/wxt/pull/2409))

### 🏡 Chore

- Add `prettier-plugin-jsdoc` to project ([#2171](https://github.com/wxt-dev/wxt/pull/2171))
- **deps:** Upgrade deps ([#2175](https://github.com/wxt-dev/wxt/pull/2175))
- Add prepack script to all packages ([032f7931](https://github.com/wxt-dev/wxt/commit/032f7931))
- Use `deps.neverBundle` instead of `external` ([8f71e174](https://github.com/wxt-dev/wxt/commit/8f71e174))
- Migrate monorepo to use Bun instead of PNPM ([#2009](https://github.com/wxt-dev/wxt/pull/2009))
- **deps-dev:** Bump typescript from 5.9.3 to 6.0.3 ([#2325](https://github.com/wxt-dev/wxt/pull/2325))
- Use `catalog:` for dev dependencies ([#2357](https://github.com/wxt-dev/wxt/pull/2357))

### ❤️ Contributors

- Muhammed Mustafa AKŞAM ([@muhammedaksam](https://github.com/muhammedaksam))
- Vaughn Bosu ([@VaughnBosu](https://github.com/VaughnBosu))
- Aaron ([@aklinker1](https://github.com/aklinker1))

## v0.5.4

[compare changes](https://github.com/wxt-dev/wxt/compare/analytics-v0.5.3...analytics-v0.5.4)

### 🩹 Fixes

- Continue using `useAppConfig` to support older versions of WXT ([bfd94556](https://github.com/wxt-dev/wxt/commit/bfd94556))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

## v0.5.3

[compare changes](https://github.com/wxt-dev/wxt/compare/analytics-v0.5.2...analytics-v0.5.3)

### 🩹 Fixes

- Add `getAppConfig` as an alias to `useAppConfig` ([#2144](https://github.com/wxt-dev/wxt/pull/2144))
- Allow `userId` option to return `undefined` ([636cf1f8](https://github.com/wxt-dev/wxt/commit/636cf1f8))
- Improve background script detection logic for analytics package ([#1808](https://github.com/wxt-dev/wxt/pull/1808))

### 🏡 Chore

- Created new types, instead of `any` for `analytics` ([#2119](https://github.com/wxt-dev/wxt/pull/2119))

### ❤️ Contributors

- Smit ([@sm17p](https://github.com/sm17p))
- Aaron ([@aklinker1](https://github.com/aklinker1))
- Patryk Kuniczak ([@PatrykKuniczak](https://github.com/PatrykKuniczak))
- Sheng Zhang ([@Arktomson](https://github.com/Arktomson))

## v0.5.2

[compare changes](https://github.com/wxt-dev/wxt/compare/analytics-v0.5.1...analytics-v0.5.2)

### 🩹 Fixes

- Normalize path for createAnalytics of analytics/index.ts ([#2013](https://github.com/wxt-dev/wxt/pull/2013))
- Allow custom API URL in Google Analytics 4 provider options ([#1653](https://github.com/wxt-dev/wxt/pull/1653))

### 💅 Refactors

- Code cleanup in analytics package ([#2084](https://github.com/wxt-dev/wxt/pull/2084))

### 🏡 Chore

- Fix other type error after `chrome` types update ([31ebf966](https://github.com/wxt-dev/wxt/commit/31ebf966))
- Upgrade dev and non-major prod dependencies ([#2000](https://github.com/wxt-dev/wxt/pull/2000))
- Use `tsdown` to build packages ([#2006](https://github.com/wxt-dev/wxt/pull/2006))
- Move script-only dev dependencies to top-level `package.json` ([#2007](https://github.com/wxt-dev/wxt/pull/2007))
- Update dependencies ([#2069](https://github.com/wxt-dev/wxt/pull/2069))

### ❤️ Contributors

- Honwhy Wang <honwhy.wang@gmail.com>
- Aaron ([@aklinker1](https://github.com/aklinker1))
- Patryk Kuniczak ([@PatrykKuniczak](https://github.com/PatrykKuniczak))

## v0.5.1

[compare changes](https://github.com/wxt-dev/wxt/compare/analytics-v0.5.0...analytics-v0.5.1)

### 🚀 Enhancements

- Integrate latest measurement protocol changes ([#1767](https://github.com/wxt-dev/wxt/pull/1767))

### 🩹 Fixes

- Use `@wxt-dev/browser` instead of `@types/chrome` ([#1645](https://github.com/wxt-dev/wxt/pull/1645))

### 🏡 Chore

- Stop using PNPM catalog ([#1644](https://github.com/wxt-dev/wxt/pull/1644))
- Upgrade `@aklinker1/check` to v2 ([#1647](https://github.com/wxt-dev/wxt/pull/1647))
- Change browser workspace dependency to `^` ([c7335add](https://github.com/wxt-dev/wxt/commit/c7335add))
- Fix auto-fixable `markdownlint` errors ([#1710](https://github.com/wxt-dev/wxt/pull/1710))
- **deps:** Upgrade typescript from 5.8.3 to 5.9.2 ([a6eef643](https://github.com/wxt-dev/wxt/commit/a6eef643))
- Create script for managing dependency upgrades ([#1875](https://github.com/wxt-dev/wxt/pull/1875))
- **deps:** Upgrade all dev dependencies ([#1876](https://github.com/wxt-dev/wxt/pull/1876))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))
- Tanishq-aggarwal ([@tanishq-aggarwal](https://github.com/tanishq-aggarwal))

## v0.5.0

[⚠️ breaking changes](https://wxt.dev/guide/resources/upgrading.html) &bull; [compare changes](https://github.com/wxt-dev/wxt/compare/analytics-v0.4.1...analytics-v0.5.0)

### 🩹 Fixes

- ⚠️  Update min WXT version to 0.20 ([2e8baf0](https://github.com/wxt-dev/wxt/commit/2e8baf0))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))