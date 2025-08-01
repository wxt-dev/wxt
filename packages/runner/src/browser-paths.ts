export type BrowserPlatform = 'windows' | 'mac' | 'linux';

export type KnownTarget =
  | 'chromium'
  | 'chrome'
  | 'chrome-beta'
  | 'chrome-dev'
  | 'chrome-canary'
  | 'edge'
  | 'edge-beta'
  | 'edge-dev'
  | 'edge-canary'
  | 'firefox'
  | 'firefox-nightly'
  | 'firefox-developer-edition'
  | 'zen';

export const KNOWN_BROWSER_PATHS: Record<
  KnownTarget,
  Record<BrowserPlatform, string[]>
> = {
  // Chromium based targets

  chromium: {
    mac: [],
    linux: [
      // Arch
      '/usr/bin/chromium',
    ],
    windows: [],
  },
  chrome: {
    mac: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chrome.app/Contents/MacOS/Google Chrome',
    ],
    linux: [],
    windows: ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
  },
  'chrome-beta': {
    mac: [],
    linux: [],
    windows: [],
  },
  'chrome-canary': {
    mac: [
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    ],
    linux: [],
    windows: [],
  },
  'chrome-dev': {
    mac: [],
    linux: [],
    windows: [],
  },
  edge: {
    mac: [],
    linux: [],
    windows: [],
  },
  'edge-beta': {
    mac: [],
    linux: [],
    windows: [],
  },
  'edge-canary': {
    mac: [],
    linux: [],
    windows: [],
  },
  'edge-dev': {
    mac: [],
    linux: [],
    windows: [],
  },

  // Firefox based targets

  firefox: {
    mac: ['/Applications/Firefox.app/Contents/MacOS/firefox'],
    linux: [
      // Arch
      '/usr/bin/firefox',
    ],
    windows: [],
  },
  'firefox-nightly': {
    mac: ['/Applications/Firefox Nightly.app/Contents/MacOS/firefox'],
    linux: [],
    windows: ['C:\\Program Files\\Firefox Nightly\\firefox.exe'],
  },
  'firefox-developer-edition': {
    mac: ['/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox'],
    linux: [
      // Arch
      '/usr/bin/firefox-developer-edition',
    ],
    windows: [],
  },
  zen: {
    mac: [
      '/Applications/Zen Browser.app/Contents/MacOS/zen',
      // Homebrew Cask
      // https://github.com/Homebrew/homebrew-cask/blob/main/Casks/z/zen.rb#L23C13-L23C19
      '/Applications/Zen.app/Contents/MacOS/zen',
    ],
    linux: [],
    windows: [],
  },
};

/**
 * When targeting a browser, this map contains the other targets to fall back on when a binary could not be found for the primary target.
 */
export const FALLBACK_TARGETS: Partial<Record<KnownTarget, KnownTarget[]>> = {
  chrome: [
    'chromium',
    'chrome-canary',
    'chrome-beta',
    'chrome-dev',
    'edge',
    'edge-canary',
    'edge-beta',
    'edge-dev',
  ],
  firefox: ['firefox-developer-edition', 'firefox-nightly', 'zen'],
};
