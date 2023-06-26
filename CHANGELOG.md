# Changelog

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

- Aaron Klinker
- Aaron
