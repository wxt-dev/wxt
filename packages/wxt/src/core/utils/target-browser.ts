import type {
  ActualBrowser,
  TargetBrowser,
  TargetBrowserMap,
} from '../../types';

/**
 * Default mapping from `--browser` values to the actual browser WXT generates
 * code for. Custom `--browser` values are only mapped when the project adds an
 * entry for them in its `targetBrowserMap` config.
 */
export const defaultTargetBrowserMap: TargetBrowserMap = {
  chrome: 'chromium',
  edge: 'chromium',
  brave: 'chromium',
  opera: 'chromium',
  chromium: 'chromium',
  firefox: 'firefox',
  safari: 'safari',
  ios: 'safari',
};

/**
 * Resolve the actual browser to generate code for from a `--browser` value.
 * Unknown values resolve to themselves so their behavior is unchanged until the
 * project maps them to an actual browser.
 */
export function resolveActualBrowser(
  browser: TargetBrowser,
  targetBrowserMap: TargetBrowserMap = defaultTargetBrowserMap,
): ActualBrowser {
  return targetBrowserMap[browser] ?? (browser as ActualBrowser);
}
