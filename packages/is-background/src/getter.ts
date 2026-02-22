import { browser } from '@wxt-dev/browser';

declare class ServiceWorkerGlobalScope {}

export function getIsBackground(): boolean {
  // Are we in an extension context?
  if (!browser?.runtime?.id) return false;

  // Is this a true MV3 service worker?
  //
  // - ❌ Chromium MV2
  // - ✅ Chromium MV3
  // - ❌ Firefox MV2
  // - ❌ Firefox MV3 - Uses a non-persistent HTML page instead of a service worker.
  // - ❔ Safari MV2 - Untested
  // - ❔ Safari MV3 - Untested
  if (
    typeof ServiceWorkerGlobalScope !== 'undefined' &&
    self instanceof ServiceWorkerGlobalScope
  ) {
    return true;
  }

  // Is this the background page?
  //
  // - ✅ Chromium MV2
  // - ✅ Firefox MV2
  // - ✅ Firefox MV3 - Works with the non-persistent HTML page
  // - ❔ Safari MV2 - Untested
  // - ❔ Safari MV3 - Untested
  return (
    typeof window !== 'undefined' &&
    typeof browser.extension?.getBackgroundPage === 'function' &&
    browser.extension.getBackgroundPage() === window
  );
}
