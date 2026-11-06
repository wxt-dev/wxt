import type { ActualBrowser, TargetBrowser, TargetBrowserMap } from '../types';

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
 *
 * Values missing from the map fall back to `chromium`, the code WXT generated
 * for unrecognized labels before `targetBrowserMap` existed. Projects can opt a
 * custom label into Firefox or Safari behavior by mapping it.
 */
export function resolveActualBrowser(
  browser: TargetBrowser,
  targetBrowserMap: TargetBrowserMap = defaultTargetBrowserMap,
): ActualBrowser {
  // Check own properties, so `--browser constructor` doesn't resolve to
  // `Object.prototype.constructor`.
  const mapped = Object.hasOwn(targetBrowserMap, browser)
    ? targetBrowserMap[browser]
    : undefined;

  return mapped ?? 'chromium';
}
