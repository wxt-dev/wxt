import browser from 'webextension-polyfill';
import {
  ContentScriptAnchoredOptions,
  ContentScriptPositioningOptions,
  applyContentScriptUiPosition,
  mountContentScriptUiRoot,
} from '../utils/content-script-ui';
import { ContentScriptContext } from './content-script-context';

/**
 * Utility for mounting a content script UI inside an iframe. Automatically removed from the DOM
 * when the content script's context is invalidated.
 *
 * See https://wxt.dev/entrypoints/content-scripts.html#iframe-ui for full documentation.
 *
 * @example
 * export default defineContentScript({
 *   matches: ["*://*.google.com/*"],
 *
 *   main(ctx) {
 *     const ui = await createContentScriptIframeUi(ctx, {
 *       page: "/content-script-overlay.html",
 *       type: "modal",
 *     })
 *     ui.mount();
 *   }
 * })
 */
export function createContentScriptIframeUi(
  ctx: ContentScriptContext,
  options: ContentScriptIframeUiOptions,
): ContentScriptIframeUi {
  const iframe = document.createElement('iframe');
  iframe.src = browser.runtime.getURL(options.page);

  const mount = () => {
    applyContentScriptUiPosition(iframe, undefined, options);
    mountContentScriptUiRoot(iframe, options);
  };

  const remove = () => {
    iframe.remove();
  };

  ctx.onInvalidated(remove);

  return {
    iframe,
    mount,
    remove,
  };
}

export interface ContentScriptIframeUi {
  /**
   * The iframe added to the DOM.
   */
  iframe: HTMLIFrameElement;
  /**
   * Function that mounts or remounts the UI on the page.
   */
  mount: () => void;
  /**
   * Function that removes the UI from the webpage.
   */
  remove: () => void;
}

export type ContentScriptIframeUiOptions = ContentScriptPositioningOptions &
  ContentScriptAnchoredOptions & {
    /**
     * The path to the unlisted HTML file to display in the iframe.
     */
    page: PublicPath;
  };
