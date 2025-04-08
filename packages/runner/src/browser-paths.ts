export type BrowserPlatform = 'win32' | 'darwin' | 'linux';

export const CHROMIUM_PATHS: Record<BrowserPlatform, string[]> = {
  darwin: ['/Applications/Chrome.app/Contents/MacOS/Google Chrome'],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge',
    '/usr/bin/microsoft-edge-dev',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge Dev\\Application\\msedge.exe',
  ],
};

export const FIREFOX_PATHS: Record<BrowserPlatform, string[]> = {
  darwin: [
    '/Applications/Firefox Nightly.app/Contents/MacOS/firefox',
    '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
    '/Applications/Firefox.app/Contents/MacOS/firefox',
  ],
  linux: [
    '/usr/bin/firefox-nightly',
    '/usr/bin/firefox-developer-edition',
    '/usr/bin/firefox',
  ],
  win32: [
    'C:\\Program Files\\Firefox Nightly\\firefox.exe',
    'C:\\Program Files\\Firefox Developer Edition\\firefox.exe',
    'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
  ],
};
