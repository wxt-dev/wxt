/**
 * This module uses a lazy getter function so the logic isn't ran until it's needed.
 *
 * This has a few benefits:
 * 1. Easier to mock in tests
 * 2. Safe to import in NodeJS environments (but it should be safe to run just in-case)
 * 3. Keeps startup fast by waiting to run the slow functions (`instanceof` or `browser.extension.getBackgroundPage`) until needed
 *
 * @module @wxt-dev/is-background
 */
import { getIsBackground } from './getter';

let cached: boolean | undefined;

/**
 * Getter that returns if the current context is apart of an extension's
 * background or not.
 *
 * > This function caches the result when called for the first time so it
 * > doesn't have to recalculate.
 *
 * @returns true when in a background page or service worker.
 */
export function isBackground(): boolean {
  if (cached == null) cached = getIsBackground();
  return cached;
}
