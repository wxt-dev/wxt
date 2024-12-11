/** @module wxt/utils/content-script-ui/shadow-root */
import { ContentScriptContext } from '../content-script-context';
import type {
  ShadowRootContentScriptUi,
  ShadowRootContentScriptUiOptions,
} from './types';
import { createIsolatedElement } from '@webext-core/isolated-element';
import { applyPosition, mountUi } from './shared';
import { logger } from '../internal/logger';

/**
 * Create a content script UI inside a [`ShadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot).
 *
 * > This function is async because it has to load the CSS via a network call.
 *
 * @see https://wxt.dev/guide/essentials/content-scripts.html#shadow-root
 */
export async function createShadowRootUi<TMounted>(
  ctx: ContentScriptContext,
  options: ShadowRootContentScriptUiOptions<TMounted>,
): Promise<ShadowRootContentScriptUi<TMounted>> {
  const css: string[] = [];

  if (!options.inheritStyles) {
    css.push(`/* WXT Shadow Root Reset */ body{all:initial;}`);
  }
  if (options.css) {
    css.push(options.css);
  }
  if (ctx.options?.cssInjectionMode === 'ui') {
    const entryCss = await loadCss();
    // Replace :root selectors with :host since we're in a shadow root
    css.push(entryCss.replaceAll(':root', ':host'));
  }

  const {
    isolatedElement: uiContainer,
    parentElement: shadowHost,
    shadow,
  } = await createIsolatedElement({
    name: options.name,
    css: {
      textContent: css.join('\n').trim(),
    },
    mode: options.mode ?? 'open',
    isolateEvents: options.isolateEvents,
  });
  shadowHost.setAttribute('data-wxt-shadow-root', '');

  let mounted: TMounted | undefined;

  const mount = () => {
    // Add shadow root element to DOM
    mountUi(shadowHost, options);
    applyPosition(shadowHost, shadow.querySelector('html'), options);
    // Mount UI inside shadow root
    mounted = options.onMount(uiContainer, shadow, shadowHost);
  };

  const remove = () => {
    // Cleanup mounted state
    options.onRemove?.(mounted);
    // Detach shadow root from DOM
    shadowHost.remove();
    // Remove children from uiContainer
    while (uiContainer.lastChild)
      uiContainer.removeChild(uiContainer.lastChild);
    // Clear mounted value
    mounted = undefined;
  };

  ctx.onInvalidated(remove);

  return {
    shadow,
    shadowHost,
    uiContainer,
    mount,
    remove,
    get mounted() {
      return mounted;
    },
  };
}

/**
 * Load the CSS for the current entrypoint.
 */
async function loadCss(): Promise<string> {
  // @ts-expect-error: getURL is defined per-project, but not inside the package
  const url = browser.runtime.getURL(
    `/content-scripts/${import.meta.env.ENTRYPOINT}.css`,
  );
  try {
    const res = await fetch(url);
    return await res.text();
  } catch (err) {
    logger.warn(
      `Failed to load styles @ ${url}. Did you forget to import the stylesheet in your entrypoint?`,
      err,
    );
    return '';
  }
}
