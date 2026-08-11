/** @module wxt/utils/debug-info */
import { browser } from 'wxt/browser';

/**
 * Collect debug information about the current browser and platform.
 *
 * @example
 *   ```ts
 *   const info = await getDebugInfo();
 *   // {
 *   //   "extensionVersion": "1.0.0",
 *   //   "browser": [
 *   //     {
 *   //       "brand": "Google Chrome",
 *   //       "version": "..."
 *   //     },
 *   //     {
 *   //       "brand": "Chromium",
 *   //       "version": "..."
 *   //     }
 *   //   ],
 *   //   "platform": {
 *   //     "os": "Windows",
 *   //     "arch": "x86"
 *   //   }
 *   // }
 *   ```;
 */
export async function getDebugInfo() {
  const debugInfo: Record<string, unknown> = {
    extensionVersion: browser.runtime.getManifest().version,
  };

  if (import.meta.env.FIREFOX) {
    // @ts-ignore
    debugInfo.browser = await browser.runtime.getBrowserInfo();
    debugInfo.platform = await browser.runtime.getPlatformInfo();
  }

  if (import.meta.env.CHROME) {
    // @ts-ignore
    const ua = await navigator.userAgentData.getHighEntropyValues([
      'fullVersionList',
      'architecture',
      'platform',
    ]);

    debugInfo.browser = ua.fullVersionList;
    debugInfo.platform = { os: ua.platform, arch: ua.architecture };
  }

  return debugInfo;
}
