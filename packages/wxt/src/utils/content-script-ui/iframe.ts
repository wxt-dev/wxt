import { browser } from 'wxt/browser';
import { ContentScriptContext } from '../content-script-context';
import { IframeContentScriptUi, IframeContentScriptUiOptions } from './types';
import { applyPosition, mountUi } from './shared';

/**
 * Create a content script UI using an iframe.
 *
 * @see https://wxt.dev/guide/essentials/content-scripts.html#iframe
 */
export function createIframeUi<TMounted>(
  ctx: ContentScriptContext,
  options: IframeContentScriptUiOptions<TMounted>,
): IframeContentScriptUi<TMounted> {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-wxt-iframe', '');
  const iframe = document.createElement('iframe');
  // @ts-expect-error: getURL is defined per-project, but not inside the package
  iframe.src = browser.runtime.getURL(options.page);
  wrapper.appendChild(iframe);

  let mounted: TMounted | undefined = undefined;
  const mount = () => {
    applyPosition(wrapper, iframe, options);
    mountUi(wrapper, options);
    mounted = options.onMount?.(wrapper, iframe);
  };
  const remove = () => {
    options.onRemove?.(mounted);
    wrapper.remove();
    mounted = undefined;
  };

  ctx.onInvalidated(remove);

  return {
    get mounted() {
      return mounted;
    },
    iframe,
    wrapper,
    mount,
    remove,
  };
}
