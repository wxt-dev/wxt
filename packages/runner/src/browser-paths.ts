export type BrowserPlatform = 'windows' | 'mac' | 'linux';

export const KNOWN_BROWSER_PATHS: Record<
  string,
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
    mac: ['/Applications/Chrome.app/Contents/MacOS/Google Chrome'],
    linux: [],
    windows: [],
  },
  'chrome-beta': {
    mac: [],
    linux: [],
    windows: [],
  },
  'chrome-canary': {
    mac: [
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
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
    mac: ['/Applications/Zen Browser.app/Contents/MacOS/zen'],
    linux: [],
    windows: [],
  },
};
