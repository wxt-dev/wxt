# Changelog

## v0.1.3

[compare changes](https://github.com/wxt-dev/wxt/compare/runner-v0.1.2...runner-v0.1.3)

### 🚀 Features

- Add Brave browser to `KnownTarget` type ([#2247](https://github.com/wxt-dev/wxt/pull/2247))

### 🩹 Fixes

- Use `obug` for debug logs in runner ([#2281](https://github.com/wxt-dev/wxt/pull/2281))

### 💅 Refactors

- Standardize file existence checks to `pathExists` ([#2083](https://github.com/wxt-dev/wxt/pull/2083))

### 🏡 Chore

- Upgrade dev and non-major prod dependencies ([#2000](https://github.com/wxt-dev/wxt/pull/2000))
- Use `tsdown` to build packages ([#2006](https://github.com/wxt-dev/wxt/pull/2006))
- Move script-only dev dependencies to top-level `package.json` ([#2007](https://github.com/wxt-dev/wxt/pull/2007))
- Update dependencies ([#2069](https://github.com/wxt-dev/wxt/pull/2069))
- Add `prettier-plugin-jsdoc` to project ([#2171](https://github.com/wxt-dev/wxt/pull/2171))
- **deps**: Upgrade deps ([#2175](https://github.com/wxt-dev/wxt/pull/2175))
- Add prepack script to all packages ([`032f793`](https://github.com/wxt-dev/wxt/commit/032f7931e843ad4a3a08e84089f80c144dc11495))
- Add cspell and fix all typos ([`6621aaf`](https://github.com/wxt-dev/wxt/commit/6621aaf8776bcb33f9fbeb6d0d11d60302249d2c))
- Migrate monorepo to use Bun instead of PNPM ([#2009](https://github.com/wxt-dev/wxt/pull/2009))
- Update browser fallbacks ([#2280](https://github.com/wxt-dev/wxt/pull/2280))
- Simplify tests ([#2279](https://github.com/wxt-dev/wxt/pull/2279))
- **deps-dev**: Bump typescript from 5.9.3 to 6.0.3 ([#2325](https://github.com/wxt-dev/wxt/pull/2325))
- **deps-dev**: Bump oxlint from 1.59.0 to 1.63.0 ([#2356](https://github.com/wxt-dev/wxt/pull/2356))
- Use `catalog:` for dev dependencies ([#2357](https://github.com/wxt-dev/wxt/pull/2357))

### ❤️ Contributors

- [@PatrykKuniczak](https://github.com/PatrykKuniczak)
- [@okineadev](https://github.com/okineadev)
- [@aklinker1](https://github.com/aklinker1)
- [@dependabot[bot]](https://github.com/dependabot[bot])


## v0.1.2

[compare changes](https://github.com/wxt-dev/wxt/compare/runner-v0.1.1...runner-v0.1.2)

### 🚀 Enhancements

- **config:** Add browser path for Zen via Homebrew ([#1813](https://github.com/wxt-dev/wxt/pull/1813))

### 🩹 Fixes

- Improve Chrome path search ([#1823](https://github.com/wxt-dev/wxt/pull/1823))
- **paths:** Add browser paths for Arc & Dia on macos ([#1814](https://github.com/wxt-dev/wxt/pull/1814))

### 🏡 Chore

- Fix auto-fixable `markdownlint` errors ([#1710](https://github.com/wxt-dev/wxt/pull/1710))
- Manually fix markdownlint errors ([#1711](https://github.com/wxt-dev/wxt/pull/1711))
- **deps:** Upgrade oxlint from 0.16.8 to 1.14.0 ([a01928e0](https://github.com/wxt-dev/wxt/commit/a01928e0))
- **deps:** Upgrade typescript from 5.8.3 to 5.9.2 ([a6eef643](https://github.com/wxt-dev/wxt/commit/a6eef643))
- Create script for managing dependency upgrades ([#1875](https://github.com/wxt-dev/wxt/pull/1875))
- **deps:** Upgrade all dev dependencies ([#1876](https://github.com/wxt-dev/wxt/pull/1876))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))
- Sam Carlton ([@ThatGuySam](https://github.com/ThatGuySam))
- Alexander Kachkaev <alexander@kachkaev.ru>

## v0.1.1

[compare changes](https://github.com/wxt-dev/wxt/compare/runner-v0.1.0...runner-v0.1.1)
