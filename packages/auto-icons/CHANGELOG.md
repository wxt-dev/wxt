# Changelog

## v1.1.2

[compare changes](https://github.com/wxt-dev/wxt/compare/auto-icons-v1.1.1...auto-icons-v1.1.2)

### 🩹 Fixes

- **auto-icons**: Dedupe merged icon sizes to prevent generating the same size multiple times ([#2493](https://github.com/wxt-dev/wxt/pull/2493))

### 🏡 Chore

- Add `prettier-plugin-jsdoc` to project ([#2171](https://github.com/wxt-dev/wxt/pull/2171))
- **deps**: Upgrade deps ([#2175](https://github.com/wxt-dev/wxt/pull/2175))
- Add prepack script to all packages ([`032f793`](https://github.com/wxt-dev/wxt/commit/032f7931e843ad4a3a08e84089f80c144dc11495))
- Replace `fs-extra` with `node:fs/promises` ([#2174](https://github.com/wxt-dev/wxt/pull/2174))
- Migrate monorepo to use Bun instead of PNPM ([#2009](https://github.com/wxt-dev/wxt/pull/2009))
- **deps-dev**: Bump typescript from 5.9.3 to 6.0.3 ([#2325](https://github.com/wxt-dev/wxt/pull/2325))
- **deps-dev**: Bump oxlint from 1.59.0 to 1.63.0 ([#2356](https://github.com/wxt-dev/wxt/pull/2356))
- Use `catalog:` for dev dependencies ([#2357](https://github.com/wxt-dev/wxt/pull/2357))
- Upgrade `sharp` to v0.35 ([`caa3dce`](https://github.com/wxt-dev/wxt/commit/caa3dceb91f67798081d9f846f348f11bcec7ba9))

### ❤️ Contributors

- [@YashNayakk](https://github.com/YashNayakk)
- [@Timeraa](https://github.com/Timeraa)
- [@okineadev](https://github.com/okineadev)
- [@aklinker1](https://github.com/aklinker1)
- [@dependabot[bot]](https://github.com/dependabot[bot])


## v1.1.1

[compare changes](https://github.com/wxt-dev/wxt/compare/auto-icons-v1.1.0...auto-icons-v1.1.1)

### 🩹 Fixes

- Auto icons override default icons ([#1616](https://github.com/wxt-dev/wxt/pull/1616))

### 💅 Refactors

- Standardize file existence checks to `pathExists` ([#2083](https://github.com/wxt-dev/wxt/pull/2083))

### 🏡 Chore

- **deps:** Upgrade oxlint from 0.16.8 to 1.14.0 ([a01928e0](https://github.com/wxt-dev/wxt/commit/a01928e0))
- **deps:** Upgrade typescript from 5.8.3 to 5.9.2 ([a6eef643](https://github.com/wxt-dev/wxt/commit/a6eef643))
- Create script for managing dependency upgrades ([#1875](https://github.com/wxt-dev/wxt/pull/1875))
- **deps:** Upgrade all dev dependencies ([#1876](https://github.com/wxt-dev/wxt/pull/1876))
- **deps:** Upgrade non-breaking production dependencies ([#1877](https://github.com/wxt-dev/wxt/pull/1877))
- Upgrade dev and non-major prod dependencies ([#2000](https://github.com/wxt-dev/wxt/pull/2000))
- Use `tsdown` to build packages ([#2006](https://github.com/wxt-dev/wxt/pull/2006))
- Move script-only dev dependencies to top-level `package.json` ([#2007](https://github.com/wxt-dev/wxt/pull/2007))
- Update dependencies ([#2069](https://github.com/wxt-dev/wxt/pull/2069))

### ❤️ Contributors

- Omerfardemir <od080624@gmail.com>
- Aaron ([@aklinker1](https://github.com/aklinker1))

## v1.1.0

[compare changes](https://github.com/wxt-dev/wxt/compare/auto-icons-v1.0.2...auto-icons-v1.1.0)

### 🚀 Enhancements

- Add overlay option for dev icons ([#1825](https://github.com/wxt-dev/wxt/pull/1825))

### 📖 Documentation

- Rewrite and restructure the documentation website ([#933](https://github.com/wxt-dev/wxt/pull/933))
- Use full URLs in README so they work on the docs site ([d20793d5](https://github.com/wxt-dev/wxt/commit/d20793d5))
- Add SVG compatibility note ([#1830](https://github.com/wxt-dev/wxt/pull/1830))

### 🏡 Chore

- Add  `oxlint` for linting ([#947](https://github.com/wxt-dev/wxt/pull/947))
- **deps:** Bump sharp from 0.33.4 to 0.33.5 ([#959](https://github.com/wxt-dev/wxt/pull/959))
- Upgrade all non-major dependencies ([#1040](https://github.com/wxt-dev/wxt/pull/1040))
- **deps:** Upgrade all non-major dependencies ([#1164](https://github.com/wxt-dev/wxt/pull/1164))
- **deps:** Bump dev and non-breaking major dependencies ([#1167](https://github.com/wxt-dev/wxt/pull/1167))
- Use PNPM 10's new catelog feature ([#1493](https://github.com/wxt-dev/wxt/pull/1493))
- Move production dependencies to PNPM 10 catelog ([#1494](https://github.com/wxt-dev/wxt/pull/1494))
- Stop using PNPM catalog ([#1644](https://github.com/wxt-dev/wxt/pull/1644))
- Upgrade `@aklinker1/check` to v2 ([#1647](https://github.com/wxt-dev/wxt/pull/1647))

### ❤️ Contributors

- Typed SIGTERM ([@typed-sigterm](https://github.com/typed-sigterm))
- Kuba ([@zizzfizzix](https://github.com/zizzfizzix))
- Aaron ([@aklinker1](https://github.com/aklinker1))

## v1.0.2

[compare changes](https://github.com/wxt-dev/wxt/compare/auto-icons-v1.0.1...auto-icons-v1.0.2)

### 📖 Documentation

- **auto-icons:** Fix configuration example typo ([#905](https://github.com/wxt-dev/wxt/pull/905))

### 🏡 Chore

- Add more metadata for npm ([#885](https://github.com/wxt-dev/wxt/pull/885))

### ❤️ Contributors

- Uncenter ([@uncenter](http://github.com/uncenter))
- Florian Metz ([@Timeraa](http://github.com/Timeraa))

## v1.0.1

[compare changes](https://github.com/wxt-dev/wxt/compare/auto-icons-v1.0.0...auto-icons-v1.0.1)

### 🩹 Fixes

- **auto-icons:** Path option ([#880](https://github.com/wxt-dev/wxt/pull/880))

### 🏡 Chore

- **deps:** Upgrade all dependencies ([#869](https://github.com/wxt-dev/wxt/pull/869))

### ❤️ Contributors

- Florian Metz ([@Timeraa](http://github.com/Timeraa))
