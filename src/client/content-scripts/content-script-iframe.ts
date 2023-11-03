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
 * See https://wxt.dev/entrypoints/content-scripts.html#iframe for full documentation.
 *
 * @example
 * export default defineContentScript({
 *   matches: ["*://*.google.com/*"],
 *
 *   main(ctx) {
 *     const ui = await createContentScriptIframe(ctx, {
 *       page: "/content-script-overlay.html",
 *       type: "modal",
 *     })
 *     ui.mount();
 *   }
 * })
 */
export function createContentScriptIframe(
  ctx: ContentScriptContext,
  options: ContentScriptIframeOptions,
): ContentScriptIframe {
  const wrapper = document.createElement('div');
  wrapper.classList.add('wxt-iframe-wrapper');
  const iframe = document.createElement('iframe');
  iframe.src = browser.runtime.getURL(options.page);
  wrapper.appendChild(iframe);

  const mount = () => {
    applyContentScriptUiPosition(wrapper, iframe, options);
    mountContentScriptUiRoot(wrapper, options);
  };

  const remove = () => {
    wrapper.remove();
  };

  ctx.onInvalidated(remove);

  return {
    iframe,
    wrapper,
    mount,
    remove,
  };
}

export interface ContentScriptIframe {
  /**
   * The iframe added to the DOM.
   */
  iframe: HTMLIFrameElement;
  /**
   * A wrapper div that assists in positioning.
   */
  wrapper: HTMLDivElement;
  /**
   * Function that mounts or remounts the UI on the page.
   */
  mount: () => void;
  /**
   * Function that removes the UI from the webpage.
   */
  remove: () => void;
}

export type ContentScriptIframeOptions = ContentScriptPositioningOptions &
  ContentScriptAnchoredOptions & {
    /**
     * The path to the unlisted HTML file to display in the iframe.
     */
    page: import('wxt/browser').PublicPath;
  };
