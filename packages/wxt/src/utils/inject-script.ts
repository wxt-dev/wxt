/** @module wxt/utils/inject-script */
import { browser } from 'wxt/browser';

export type ScriptPublicPath = Extract<
  // @ts-expect-error: PublicPath is generated per-project
  import('wxt/browser').PublicPath,
  `${string}.js`
>;

/**
 * This function can only be called inside content scripts.
 *
 * Inject an unlisted script into the page. Scripts are added to the `<head>`
 * element or `document.documentElement` if there is no head.
 *
 * Make sure to add the injected script to your manifest's
 * `web_accessible_resources`.
 */
export async function injectScript(
  path: ScriptPublicPath,
  options?: InjectScriptOptions,
): Promise<void> {
  // @ts-expect-error: getURL is defined per-project, but not inside the package
  const url = browser.runtime.getURL(path);
  const script = document.createElement('script');

  if (browser.runtime.getManifest().manifest_version === 2) {
    // MV2 requires using an inline script
    script.innerHTML = await fetch(url).then((res) => res.text());
  } else {
    // MV3 requires using src
    script.src = url;
  }

  if (
    options?.awaitExecution &&
    browser.runtime.getManifest().manifest_version === 3
  ) {
    // For MV3 with awaitExecution, return a promise that resolves when script loads
    return new Promise<void>((resolve, reject) => {
      script.onload = () => {
        if (!options?.keepInDom) {
          script.remove();
        }
        resolve();
      };
      script.onerror = () => {
        if (!options?.keepInDom) {
          script.remove();
        }
        reject(new Error(`Failed to load script: ${path}`));
      };
      (document.head ?? document.documentElement).append(script);
    });
  } else {
    if (!options?.keepInDom) {
      script.onload = () => script.remove();
    }
    (document.head ?? document.documentElement).append(script);
  }
}

export interface InjectScriptOptions {
  /**
   * By default, the injected script is removed from the DOM after being
   * injected. To disable this behavior, set this flag to true.
   */
  keepInDom?: boolean;
  /**
   * If true, the function will return a promise that resolves when the script
   * has finished loading. Only supported in MV3.
   */
  awaitExecution?: boolean;
}
