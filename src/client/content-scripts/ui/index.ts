import { browser } from '~/browser';
import { ContentScriptContext } from '..';
import {
  ContentScriptAnchoredOptions,
  ContentScriptPositioningOptions,
  IframeContentScriptUi,
  IframeContentScriptUiOptions,
  IntegratedContentScriptUi,
  IntegratedContentScriptUiOptions,
  ShadowRootContentScriptUi,
  ShadowRootContentScriptUiOptions,
} from './types';
import { logger } from '~/sandbox/utils/logger';
import { createIsolatedElement } from '@webext-core/isolated-element';
export * from './types';

/**
 * Create a content script UI without any isolation.
 *
 * @see https://wxt.dev/guide/content-script-ui.html#integrated
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
    wrapper.remove();
  };

  ctx.onInvalidated(remove);

  return {
    mounted,
    wrapper,
    mount,
    remove,
  };
}

/**
 * Create a content script UI using an iframe.
 *
 * @see https://wxt.dev/guide/content-script-ui.html#iframe
 */
export function createIframeUi<TMounted>(
  ctx: ContentScriptContext,
  options: IframeContentScriptUiOptions<TMounted>,
): IframeContentScriptUi<TMounted> {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-wxt-iframe', '');
  const iframe = document.createElement('iframe');
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
  };

  ctx.onInvalidated(remove);

  return {
    mounted,
    iframe,
    wrapper,
    mount,
    remove,
  };
}

/**
 * Create a content script UI inside a [`ShadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot).
 *
 * > This function is async because it has to load the CSS via a network call.
 *
 * @see https://wxt.dev/guide/content-script-ui.html#shadowroot
 */
export async function createShadowRootUi<TMounted>(
  ctx: ContentScriptContext,
  options: ShadowRootContentScriptUiOptions<TMounted>,
): Promise<ShadowRootContentScriptUi<TMounted>> {
  const css = [options.css ?? ''];
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

  let mounted: TMounted;

  const mount = () => {
    // Add shadow root element to DOM
    mountUi(shadowHost, options);
    // Mount UI inside shadow root
    mounted = options.onMount(uiContainer, shadow, shadowHost);
    applyPosition(shadowHost, shadow.querySelector('html'), options);
  };

  const remove = () => {
    // Detatch shadow root from DOM
    shadowHost.remove();
    // Cleanup mounted state
    options.onRemove?.(mounted);
    // Remove children from uiContainer
    while (uiContainer.lastChild)
      uiContainer.removeChild(uiContainer.lastChild);
  };

  ctx.onInvalidated(remove);

  return {
    shadow,
    shadowHost,
    uiContainer,
    mount,
    remove,
    mounted: mounted!,
  };
}

function applyPosition(
  root: HTMLElement,
  positionedElement: HTMLElement | undefined | null,
  options: ContentScriptPositioningOptions,
): void {
  // No positioning for inline UIs
  if (options.position === 'inline') return;

  if (options.zIndex != null) root.style.zIndex = String(options.zIndex);

  root.style.overflow = 'visible';
  root.style.position = 'relative';
  root.style.width = '0';
  root.style.height = '0';
  root.style.display = 'block';

  if (positionedElement) {
    if (options.position === 'overlay') {
      positionedElement.style.position = 'absolute';
      if (options.alignment?.startsWith('bottom-'))
        positionedElement.style.bottom = '0';
      else positionedElement.style.top = '0';

      if (options.alignment?.endsWith('-right'))
        positionedElement.style.right = '0';
      else positionedElement.style.left = '0';
    } else {
      positionedElement.style.position = 'fixed';
      positionedElement.style.top = '0';
      positionedElement.style.bottom = '0';
      positionedElement.style.left = '0';
      positionedElement.style.right = '0';
    }
  }
}

function getAnchor(options: ContentScriptAnchoredOptions): Element | undefined {
  if (options.anchor == null) return document.body;

  let resolved =
    typeof options.anchor === 'function' ? options.anchor() : options.anchor;
  if (typeof resolved === 'string')
    return document.querySelector<Element>(resolved) ?? undefined;
  return resolved ?? undefined;
}

function mountUi(
  root: HTMLElement,
  options: ContentScriptAnchoredOptions,
): void {
  const anchor = getAnchor(options);
  if (anchor == null)
    throw Error(
      'Failed to mount content script UI: could not find anchor element',
    );

  switch (options.append) {
    case undefined:
    case 'last':
      anchor.append(root);
      break;
    case 'first':
      anchor.prepend(root);
      break;
    case 'replace':
      anchor.replaceWith(root);
      break;
    case 'after':
      anchor.parentElement?.insertBefore(root, anchor.nextElementSibling);
      break;
    case 'before':
      anchor.parentElement?.insertBefore(root, anchor);
      break;
    default:
      options.append(anchor, root);
      break;
  }
}

/**
 * Load the CSS for the current entrypoint.
 */
async function loadCss(): Promise<string> {
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
