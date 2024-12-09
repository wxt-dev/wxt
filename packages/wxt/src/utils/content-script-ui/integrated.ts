import { ContentScriptContext } from '..';
import {
  IntegratedContentScriptUi,
  IntegratedContentScriptUiOptions,
} from './types';
import { applyPosition, mountUi } from './shared';

/**
 * Create a content script UI without any isolation.
 *
 * @see https://wxt.dev/guide/essentials/content-scripts.html#integrated
 */
export function createIntegratedUi<TMounted>(
  ctx: ContentScriptContext,
  options: IntegratedContentScriptUiOptions<TMounted>,
): IntegratedContentScriptUi<TMounted> {
  const wrapper = document.createElement(options.tag || 'div');
  wrapper.setAttribute('data-wxt-integrated', '');

  let mounted: TMounted | undefined = undefined;
  const mount = () => {
    applyPosition(wrapper, undefined, options);
    mountUi(wrapper, options);
    mounted = options.onMount?.(wrapper);
  };
  const remove = () => {
    options.onRemove?.(mounted);
    wrapper.replaceChildren();
    wrapper.remove();
    mounted = undefined;
  };

  ctx.onInvalidated(remove);

  return {
    get mounted() {
      return mounted;
    },
    wrapper,
    mount,
    remove,
  };
}
