# Changelog

## v0.4.0

[compare changes](https://github.com/aklinker1/wxt/compare/v0.3.2...v0.4.0)

### 🚀 Enhancements

- Add `--debug` flag for printing debug logs for all CLI commands ([#75](https://github.com/aklinker1/wxt/pull/75))
- Replace `web-ext` with `web-ext-run` ([#101](https://github.com/aklinker1/wxt/pull/101))
- Generate types for `browser.i18n.getMessage` ([#103](https://github.com/aklinker1/wxt/pull/103))

### 🩹 Fixes

- Allow adding custom content scripts ([b428a62](https://github.com/aklinker1/wxt/commit/b428a62))
- Don't overwrite `wxt.config.ts` content scripts, append entrypoints to it ([5f5f1d9](https://github.com/aklinker1/wxt/commit/5f5f1d9))
- ⚠️  Use relative path aliases inside `.wxt/tsconfig.json` ([#102](https://github.com/aklinker1/wxt/pull/102))

### 📖 Documentation

- Add contribution guide ([#76](https://github.com/aklinker1/wxt/pull/76))

### 🏡 Chore

- Setup dependabot for upgrading dependencies ([d66293c](https://github.com/aklinker1/wxt/commit/d66293c))
- Update social preview ([e164bd5](https://github.com/aklinker1/wxt/commit/e164bd5))
- Setup bug and feature issue templates ([2bde917](https://github.com/aklinker1/wxt/commit/2bde917))
- Upgrade to prettier 3 ([#77](https://github.com/aklinker1/wxt/pull/77))
- **deps-dev:** Bump vitest from 0.32.4 to 0.34.1 ([#81](https://github.com/aklinker1/wxt/pull/81))
- **deps-dev:** Bump ora from 6.3.1 to 7.0.1 ([#79](https://github.com/aklinker1/wxt/pull/79))
- **deps-dev:** Bump @types/node from 20.4.5 to 20.5.0 ([#78](https://github.com/aklinker1/wxt/pull/78))
- **deps-dev:** Bump tsup from 7.1.0 to 7.2.0 ([#80](https://github.com/aklinker1/wxt/pull/80))
- **deps-dev:** Bump @vitest/coverage-v8 from 0.32.4 to 0.34.1 ([#84](https://github.com/aklinker1/wxt/pull/84))
- **deps-dev:** Bump vitepress from 1.0.0-beta.5 to 1.0.0-rc.4 ([#85](https://github.com/aklinker1/wxt/pull/85))
- **deps-dev:** Bump vitest-mock-extended from 1.1.4 to 1.2.0 ([#87](https://github.com/aklinker1/wxt/pull/87))
- **deps-dev:** Bump lint-staged from 13.3.0 to 14.0.0 ([#89](https://github.com/aklinker1/wxt/pull/89))
- Fix remote code E2E test ([83e62a1](https://github.com/aklinker1/wxt/commit/83e62a1))
- Fix failing demo build ([b58a15e](https://github.com/aklinker1/wxt/commit/b58a15e))
- **deps-dev:** Bump vitest-mock-extended from 1.2.0 to 1.2.1 ([#97](https://github.com/aklinker1/wxt/pull/97))
- **deps-dev:** Bump lint-staged from 14.0.0 to 14.0.1 ([#100](https://github.com/aklinker1/wxt/pull/100))
- **deps-dev:** Bump vitest from 0.34.1 to 0.34.3 ([#99](https://github.com/aklinker1/wxt/pull/99))
- Increase E2E test timeout because GitHub Actions Window runner is slow ([2a0842b](https://github.com/aklinker1/wxt/commit/2a0842b))
- **deps-dev:** Bump vitepress from 1.0.0-rc.4 to 1.0.0-rc.10 ([#96](https://github.com/aklinker1/wxt/pull/96))
- Fix test watcher restarting indefinetly ([2c7922c](https://github.com/aklinker1/wxt/commit/2c7922c))
- Remove explict icon config from templates ([93bfee0](https://github.com/aklinker1/wxt/commit/93bfee0))
- Use import aliases in Vue template ([#104](https://github.com/aklinker1/wxt/pull/104))

#### ⚠️ Breaking Changes

- ⚠️  Use relative path aliases inside `.wxt/tsconfig.json` ([#102](https://github.com/aklinker1/wxt/pull/102))

### ❤️ Contributors

- Aaron <aaronklinker1@gmail.com>
- Aaron Klinker <aaronklinker1@gmail.com>

## v0.3.2

[compare changes](https://github.com/aklinker1/wxt/compare/v0.3.1...v0.3.2)

### 🚀 Enhancements

- Discover icons from the public directory ([#72](https://github.com/aklinker1/wxt/pull/72))
- Don't allow auto-importing from subdirectories ([d54d611](https://github.com/aklinker1/wxt/commit/d54d611))

### 📖 Documentation

- Document the `url:` import prefix for remote code ([323045a](https://github.com/aklinker1/wxt/commit/323045a))
- Fix typos ([97f0938](https://github.com/aklinker1/wxt/commit/97f0938))
- Fix capitalization ([39467d1](https://github.com/aklinker1/wxt/commit/39467d1))
- Generate markdown for config reference ([#74](https://github.com/aklinker1/wxt/pull/74))

### 🏡 Chore

- Upgrade dependencies ([798f02f](https://github.com/aklinker1/wxt/commit/798f02f))
- Upgrade vite (`v4.3` &rarr; `v4.4`) ([547c185](https://github.com/aklinker1/wxt/commit/547c185))
- Update templates to work with CSS entrypoints ([7f15305](https://github.com/aklinker1/wxt/commit/7f15305))
- Improve file list output in CI ([#73](https://github.com/aklinker1/wxt/pull/73))

### 🤖 CI

- Validate templates against `main` ([#66](https://github.com/aklinker1/wxt/pull/66))
- List vite version when validating project templates ([ef140dc](https://github.com/aklinker1/wxt/commit/ef140dc))
- Validate templates using tarball to avoid version conflicts within the `wxt/node_modules` directory ([edfa075](https://github.com/aklinker1/wxt/commit/edfa075))

### ❤️  Contributors

- Aaron <aaronklinker1@gmail.com>
- Aaron Klinker <aaronklinker1@gmail.com>

## v0.3.1

[compare changes](https://github.com/aklinker1/wxt/compare/v0.3.0...v0.3.1)

### 🚀 Enhancements

- CSS entrypoints ([#61](https://github.com/aklinker1/wxt/pull/61))
- `init` command for bootstrapping new projects ([#65](https://github.com/aklinker1/wxt/pull/65))

### 📖 Documentation

- Add zip command to installation scripts ([94a1097](https://github.com/aklinker1/wxt/commit/94a1097))
- Add output paths to entrypoint docs ([3a336eb](https://github.com/aklinker1/wxt/commit/3a336eb))
- Update installation docs ([aea866c](https://github.com/aklinker1/wxt/commit/aea866c))
- Add publishing docs ([4184b05](https://github.com/aklinker1/wxt/commit/4184b05))
- Add a section for extensions using WXT ([709b61a](https://github.com/aklinker1/wxt/commit/709b61a))
- Add a comparison page to compare and contrast against Plasmo ([38d4f9c](https://github.com/aklinker1/wxt/commit/38d4f9c))

### 🏡 Chore

- Update template projects to v0.3 ([#56](https://github.com/aklinker1/wxt/pull/56))
- Branding and logo ([#60](https://github.com/aklinker1/wxt/pull/60))
- Simplify binary setup ([#62](https://github.com/aklinker1/wxt/pull/62))
- Add Solid template ([#63](https://github.com/aklinker1/wxt/pull/63))
- Increate E2E test timeout to fix flakey test ([dfe424f](https://github.com/aklinker1/wxt/commit/dfe424f))

### 🤖 CI

- Speed up demo validation ([3a9fd39](https://github.com/aklinker1/wxt/commit/3a9fd39))
- Fix flakey failure when validating templates ([25677ba](https://github.com/aklinker1/wxt/commit/25677ba))

### ❤️  Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))
- BeanWei ([@BeanWei](https://github.com/BeanWei))

## v0.3.0

[compare changes](https://github.com/aklinker1/wxt/compare/v0.2.5...v0.3.0)

### 🚀 Enhancements

- ⚠️  Add type safety to `browser.runtime.getURL` ([58a84ec](https://github.com/aklinker1/wxt/commit/58a84ec))
- ⚠️  Change default `publicDir` to `<rootDir>/public` ([19c0948](https://github.com/aklinker1/wxt/commit/19c0948))
- Windows support ([#50](https://github.com/aklinker1/wxt/pull/50))

### 🩹 Fixes

- Add `WebWorker` lib to generated tsconfig ([2c70246](https://github.com/aklinker1/wxt/commit/2c70246))

### 📖 Documentation

- Update entrypoint directory links ([0aebb67](https://github.com/aklinker1/wxt/commit/0aebb67))

### 🌊 Types

- Allow any string for the `__BROWSER__` global ([6092235](https://github.com/aklinker1/wxt/commit/6092235))

### 🤖 CI

- Improve checks against `demo/` extension ([9cc464f](https://github.com/aklinker1/wxt/commit/9cc464f))

#### ⚠️  Breaking Changes

- ⚠️  Add type safety to `browser.runtime.getURL` ([58a84ec](https://github.com/aklinker1/wxt/commit/58a84ec))
- ⚠️  Change default `publicDir` to `<rootDir>/public` ([19c0948](https://github.com/aklinker1/wxt/commit/19c0948))

### ❤️  Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.2.5

[compare changes](https://github.com/aklinker1/wxt/compare/v0.2.4...v0.2.5)

### 🚀 Enhancements

- Auto-import from subdirectories ([547fee0](https://github.com/aklinker1/wxt/commit/547fee0))
- Include background script in dev mode if user doesn't define one ([ca20a21](https://github.com/aklinker1/wxt/commit/ca20a21))

### 🩹 Fixes

- Don't crash when generating types in dev mode ([d8c1903](https://github.com/aklinker1/wxt/commit/d8c1903))
- Properly load entrypoints that reference `import.meta` ([54b18cc](https://github.com/aklinker1/wxt/commit/54b18cc))

### 🏡 Chore

- Update templates to wxt@0.2 ([9d00eb2](https://github.com/aklinker1/wxt/commit/9d00eb2))

### 🤖 CI

- Validate project templates ([9ac756f](https://github.com/aklinker1/wxt/commit/9ac756f))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.2.4

[compare changes](https://github.com/aklinker1/wxt/compare/v0.2.3...v0.2.4)

### 🚀 Enhancements

- Add `wxt zip` command ([#47](https://github.com/aklinker1/wxt/pull/47))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.2.3

[compare changes](https://github.com/aklinker1/wxt/compare/v0.2.2...v0.2.3)

### 🩹 Fixes

- Correctly lookup open port ([#45](https://github.com/aklinker1/wxt/pull/45))
- Read boolean maniest options from meta tags correctly ([495c5c8](https://github.com/aklinker1/wxt/commit/495c5c8))
- Some fields cannot be overridden from `config.manifest` ([#46](https://github.com/aklinker1/wxt/pull/46))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.2.2

[compare changes](https://github.com/aklinker1/wxt/compare/v0.2.1...v0.2.2)

### 🩹 Fixes

- Register content scripts correctly in dev mode ([2fb5a54](https://github.com/aklinker1/wxt/commit/2fb5a54))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.2.1

[compare changes](https://github.com/aklinker1/wxt/compare/v0.2.0...v0.2.1)

### 🚀 Enhancements

- Support all content script options ([6f5bf89](https://github.com/aklinker1/wxt/commit/6f5bf89))

### 🩹 Fixes

- Remove HMR log ([90fa6bf](https://github.com/aklinker1/wxt/commit/90fa6bf))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.2.0

[compare changes](https://github.com/aklinker1/wxt/compare/v0.1.6...v0.2.0)

### 🚀 Enhancements

- ⚠️ Rename `defineBackgroundScript` to `defineBackground` ([5b48ae9](https://github.com/aklinker1/wxt/commit/5b48ae9))
- Recongize unnamed content scripts (`content.ts` and `content/index.ts`) ([3db5cec](https://github.com/aklinker1/wxt/commit/3db5cec))

### 📖 Documentation

- Update templates ([f28a29e](https://github.com/aklinker1/wxt/commit/f28a29e))
- Add docs for each type of entrypoint ([77cbfc1](https://github.com/aklinker1/wxt/commit/77cbfc1))
- Add inline JSDoc for public types ([375a2a6](https://github.com/aklinker1/wxt/commit/375a2a6))

### 🏡 Chore

- Run `wxt prepare` on `postinstall` ([c1ea9ba](https://github.com/aklinker1/wxt/commit/c1ea9ba))
- Don't format lockfile ([5c7e041](https://github.com/aklinker1/wxt/commit/5c7e041))

#### ⚠️ Breaking Changes

- ⚠️ Rename `defineBackgroundScript` to `defineBackground` ([5b48ae9](https://github.com/aklinker1/wxt/commit/5b48ae9))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.1.6

[compare changes](https://github.com/aklinker1/wxt/compare/v0.1.5...v0.1.6)

### 🩹 Fixes

- Resolve tsconfig paths in vite ([ea92a27](https://github.com/aklinker1/wxt/commit/ea92a27))
- Add logs when a hot reload happens ([977246f](https://github.com/aklinker1/wxt/commit/977246f))

### 🏡 Chore

- React and Vue starter templates ([#33](https://github.com/aklinker1/wxt/pull/33))
- Svelte template ([#34](https://github.com/aklinker1/wxt/pull/34))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.1.5

[compare changes](https://github.com/aklinker1/wxt/compare/v0.1.4...v0.1.5)

### 🩹 Fixes

- Include `vite/client` types ([371be99](https://github.com/aklinker1/wxt/commit/371be99))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.1.4

[compare changes](https://github.com/aklinker1/wxt/compare/v0.1.3...v0.1.4)

### 🩹 Fixes

- Fix regression where manifest was not listed first in build summary ([fa2b656](https://github.com/aklinker1/wxt/commit/fa2b656))
- Fix config hook implementations for vite plugins ([49965e7](https://github.com/aklinker1/wxt/commit/49965e7))

### 📖 Documentation

- Update CLI screenshot ([0a26673](https://github.com/aklinker1/wxt/commit/0a26673))

### 🏡 Chore

- Update prettier ignore ([68611ae](https://github.com/aklinker1/wxt/commit/68611ae))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.1.3

[compare changes](https://github.com/aklinker1/wxt/compare/v0.1.2...v0.1.3)

### 🚀 Enhancements

- Add tsconfig path aliases ([#32](https://github.com/aklinker1/wxt/pull/32))

### 🩹 Fixes

- Merge `manifest` option from both inline and user config ([05ca998](https://github.com/aklinker1/wxt/commit/05ca998))
- Cleanup build summary with sourcemaps ([ac0b28e](https://github.com/aklinker1/wxt/commit/ac0b28e))

### 📖 Documentation

- Create documentation site ([#31](https://github.com/aklinker1/wxt/pull/31))

### 🏡 Chore

- Upgrade to pnpm 8 ([0ce7c9d](https://github.com/aklinker1/wxt/commit/0ce7c9d))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.1.2

[compare changes](https://github.com/aklinker1/wxt/compare/v0.1.1...v0.1.2)

### 🚀 Enhancements

- Accept a function for `config.manifest` ([ee49837](https://github.com/aklinker1/wxt/commit/ee49837))

### 🩹 Fixes

- Add missing types for `webextension-polyfill` and the `manifest` option ([636aa48](https://github.com/aklinker1/wxt/commit/636aa48))
- Only add imports to JS files ([b29c3c6](https://github.com/aklinker1/wxt/commit/b29c3c6))
- Generate valid type for `EntrypointPath` when there are no entrypoints ([6e7184d](https://github.com/aklinker1/wxt/commit/6e7184d))

### 🌊 Types

- Change `config.vite` to `UserConfig` ([ef6001e](https://github.com/aklinker1/wxt/commit/ef6001e))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.1.1

[compare changes](https://github.com/aklinker1/wxt/compare/v0.1.0...v0.1.1)

### 🩹 Fixes

- Allow dashes in entrypoint names ([2e51e73](https://github.com/aklinker1/wxt/commit/2e51e73))
- Unable to read entrypoint options ([#28](https://github.com/aklinker1/wxt/pull/28))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.1.0

Initial release of WXT. Full support for production builds and initial toolkit for development:

- HMR support when HTML page dependencies change
- Reload extension when background changes
- Reload HTML pages when saving them directly
- Re-register and reload tabs when content scripts change

[compare changes](https://github.com/aklinker1/wxt/compare/v0.0.2...v0.1.0)

### 🚀 Enhancements

- Content scripts reloading ([#25](https://github.com/aklinker1/wxt/pull/25))

### 📖 Documentation

- Update feature list ([0255028](https://github.com/aklinker1/wxt/commit/0255028))

### 🤖 CI

- Create github release ([b7c078f](https://github.com/aklinker1/wxt/commit/b7c078f))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.0.2

[compare changes](https://github.com/aklinker1/wxt/compare/v0.0.1...v0.0.2)

### 🚀 Enhancements

- Reload extension when source code is changed ([#17](https://github.com/aklinker1/wxt/pull/17))
- Setup background script web socket/reload ([#22](https://github.com/aklinker1/wxt/pull/22))
- Reload HTML files individually ([#23](https://github.com/aklinker1/wxt/pull/23))

### 🩹 Fixes

- Output chunks to a chunks directory ([2dd7a99](https://github.com/aklinker1/wxt/commit/2dd7a99))
- Remove hash from content script css outputs ([#20](https://github.com/aklinker1/wxt/pull/20))
- Overwrite files with the same name when renaming entrypoints in dev mode ([37986bf](https://github.com/aklinker1/wxt/commit/37986bf))
- Separate template builds to prevent sharing chunks ([7f3a1e8](https://github.com/aklinker1/wxt/commit/7f3a1e8))
- Show Vite warnings and errors ([c51f0e0](https://github.com/aklinker1/wxt/commit/c51f0e0))

### 📖 Documentation

- Add milestone progress badge to README ([684197d](https://github.com/aklinker1/wxt/commit/684197d))
- Fix milestone link in README ([e14f81d](https://github.com/aklinker1/wxt/commit/e14f81d))

### 🏡 Chore

- Refactor build output type ([#19](https://github.com/aklinker1/wxt/pull/19))
- Refactor build outputs to support transpiled templates ([a78aada](https://github.com/aklinker1/wxt/commit/a78aada))
- Rename `templates` to `virtual-modules` ([#24](https://github.com/aklinker1/wxt/pull/24))
- Update cli screenshot ([54eb118](https://github.com/aklinker1/wxt/commit/54eb118))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))

## v0.0.1

[compare changes](https://github.com/aklinker1/wxt/compare/v0.0.0...v0.0.1)

### 🚀 Enhancements

- Add logger to config ([232ff7a](https://github.com/aklinker1/wxt/commit/232ff7a))
- Export and bootstrap the `/client` package ([5b07c95](https://github.com/aklinker1/wxt/commit/5b07c95))
- Resolve entrypoints based on filesystem ([a63f061](https://github.com/aklinker1/wxt/commit/a63f061))
- Separate output directories for each browser/manifest version ([f09ffbb](https://github.com/aklinker1/wxt/commit/f09ffbb))
- Build entrypoints and output `manfiest.json` ([1e7c738](https://github.com/aklinker1/wxt/commit/1e7c738))
- Automatically add CSS files to content scripts ([047ce04](https://github.com/aklinker1/wxt/commit/047ce04))
- Download and bundle remote URL imports ([523c7df](https://github.com/aklinker1/wxt/commit/523c7df))
- Generate type declarations and config for project types and auto-imports ([21debad](https://github.com/aklinker1/wxt/commit/21debad))
- Good looking console output ([e2cc995](https://github.com/aklinker1/wxt/commit/e2cc995))
- Dev server working and a valid extension is built ([505e419](https://github.com/aklinker1/wxt/commit/505e419))
- Virtualized content script entrypoint ([ca29537](https://github.com/aklinker1/wxt/commit/ca29537))
- Provide custom, typed globals defined by Vite ([8c59a1c](https://github.com/aklinker1/wxt/commit/8c59a1c))
- Copy public directory to outputs ([1a25f2b](https://github.com/aklinker1/wxt/commit/1a25f2b))
- Support browser and chrome styles for mv2 popups ([7945c94](https://github.com/aklinker1/wxt/commit/7945c94))
- Support browser and chrome styles for mv2 popups ([7abb577](https://github.com/aklinker1/wxt/commit/7abb577))
- Support more CLI flags for `build` and `dev` ([#9](https://github.com/aklinker1/wxt/pull/9))
- Add more supported browser types ([f114c5b](https://github.com/aklinker1/wxt/commit/f114c5b))
- Open browser when starting dev server ([#11](https://github.com/aklinker1/wxt/pull/11))

### 🩹 Fixes

- Support `srcDir` config ([739d19f](https://github.com/aklinker1/wxt/commit/739d19f))
- Root path customization now works ([4faa3b3](https://github.com/aklinker1/wxt/commit/4faa3b3))
- Print durations as ms/s based on total time ([3e37de9](https://github.com/aklinker1/wxt/commit/3e37de9))
- Don't print error twice when background crashes ([407627c](https://github.com/aklinker1/wxt/commit/407627c))
- Load package.json from root not cwd ([3ca16ee](https://github.com/aklinker1/wxt/commit/3ca16ee))
- Only allow a single entrypoint with a given name ([8eb4e86](https://github.com/aklinker1/wxt/commit/8eb4e86))
- Respect the mv2 popup type ([0f37ceb](https://github.com/aklinker1/wxt/commit/0f37ceb))
- Respect background type and persistent manifest options ([573ef80](https://github.com/aklinker1/wxt/commit/573ef80))
- Make content script array orders consistent ([f380378](https://github.com/aklinker1/wxt/commit/f380378))
- Firefox manifest warnings in dev mode ([50bb845](https://github.com/aklinker1/wxt/commit/50bb845))

### 📖 Documentation

- Update README ([785ea54](https://github.com/aklinker1/wxt/commit/785ea54))
- Update README ([99ccadb](https://github.com/aklinker1/wxt/commit/99ccadb))
- Update description ([07a262e](https://github.com/aklinker1/wxt/commit/07a262e))
- Update README ([58a0ef4](https://github.com/aklinker1/wxt/commit/58a0ef4))
- Update README ([23ed6f7](https://github.com/aklinker1/wxt/commit/23ed6f7))
- Add initial release milestone link to README ([b400e54](https://github.com/aklinker1/wxt/commit/b400e54))
- Fix typo in README ([5590c9d](https://github.com/aklinker1/wxt/commit/5590c9d))

### 🏡 Chore

- Refactor cli files into their own directory ([e6c0d84](https://github.com/aklinker1/wxt/commit/e6c0d84))
- Simplify `BuildOutput` type ([1f6c4a0](https://github.com/aklinker1/wxt/commit/1f6c4a0))
- Move `.exvite` directory into `srcDir` instead of `root` ([53fb805](https://github.com/aklinker1/wxt/commit/53fb805))
- Refactor CLI commands ([b8952b6](https://github.com/aklinker1/wxt/commit/b8952b6))
- Improve build summary sorting ([ec57e8c](https://github.com/aklinker1/wxt/commit/ec57e8c))
- Remove comments ([e3e9c0d](https://github.com/aklinker1/wxt/commit/e3e9c0d))
- Refactor internal config creation ([7c634f4](https://github.com/aklinker1/wxt/commit/7c634f4))
- Check virtual entrypoints feature in README ([70208f4](https://github.com/aklinker1/wxt/commit/70208f4))
- Add E2E tests and convert to vitest workspace ([5813302](https://github.com/aklinker1/wxt/commit/5813302))
- Rename package to wxt ([51a1072](https://github.com/aklinker1/wxt/commit/51a1072))
- Fix header log's timestamp ([8ca5657](https://github.com/aklinker1/wxt/commit/8ca5657))
- Fix demo global usage ([1ecfedd](https://github.com/aklinker1/wxt/commit/1ecfedd))
- Refactor folder structure ([9ab3953](https://github.com/aklinker1/wxt/commit/9ab3953))
- Fix release workflow ([2e94f2a](https://github.com/aklinker1/wxt/commit/2e94f2a))

### 🤖 CI

- Create validation workflow ([#12](https://github.com/aklinker1/wxt/pull/12))
- Create release workflow ([#13](https://github.com/aklinker1/wxt/pull/13))

### ❤️ Contributors

- Aaron Klinker ([@aklinker1](https://github.com/aklinker1))
