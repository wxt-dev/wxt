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
 *
 * @returns A result object containing the created script element.
 */
export async function injectScript(
  path: ScriptPublicPath,
  options?: InjectScriptOptions,
): Promise<InjectScriptResult> {
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

  const loadedPromise = makeLoadedPromise(script);

  await options?.modifyScript?.(script);

  (document.head ?? document.documentElement).append(script);

  if (!options?.keepInDom) {
    script.remove();
  }

  await loadedPromise;
  
  return {
    script,
  };
}

function makeLoadedPromise(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const onload = () => {
      resolve();
      cleanup();
    };

    const onerror = () => {
      reject(new Error(`Failed to load script: ${script.src}`));
      cleanup();
    };

    const cleanup = () => {
      script.removeEventListener('load', onload);
      script.removeEventListener('error', onerror);
    };

    script.addEventListener('load', onload);
    script.addEventListener('error', onerror);
  });
}

export interface InjectScriptOptions {
  /**
   * By default, the injected script is removed from the DOM after being
   * injected. To disable this behavior, set this flag to true.
   */
  keepInDom?: boolean;
  /**
   * Modify the script element just before it is added to the DOM.
   *
   * It can be used to e.g. modify `script.async`/`script.defer`, add event
   * listeners to the element, or pass data to the script via `script.dataset`
   * (which can be accessed by the script via `document.currentScript`).
   */
  modifyScript?: (script: HTMLScriptElement) => Promise<void> | void;
}

export interface InjectScriptResult {
  /**
   * The created script element. It can be used to e.g. send messages to the
   * script in the form of custom events. The script can add an event listener
   * for them via `document.currentScript`.
   */
  script: HTMLScriptElement;
}
