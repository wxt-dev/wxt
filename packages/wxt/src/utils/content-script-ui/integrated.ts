/** @module wxt/utils/content-script-ui/integrated */
import { ContentScriptContext } from '../content-script-context';
import type {
  IntegratedContentScriptUi,
  IntegratedContentScriptUiOptions,
} from './types';
import { applyPosition, createMountFunctions, mountUi } from './shared';

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

  const mountFunctions = createMountFunctions(
    {
      mount,
      remove,
    },
    options,
  );

  ctx.onInvalidated(remove);

  return {
    get mounted() {
      return mounted;
    },
    wrapper,
    ...mountFunctions,
  };
}
