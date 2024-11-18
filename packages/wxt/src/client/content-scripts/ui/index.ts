import { browser } from 'wxt/browser';
import { waitElement } from '@1natsu/wait-element';
import {
  isExist as mountDetector,
  isNotExist as removeDetector,
} from '@1natsu/wait-element/detectors';
import { ContentScriptContext } from '..';
import {
  AutoMountOptions,
  ContentScriptAnchoredOptions,
  ContentScriptPositioningOptions,
  IframeContentScriptUi,
  IframeContentScriptUiOptions,
  IntegratedContentScriptUi,
  IntegratedContentScriptUiOptions,
  ShadowRootContentScriptUi,
  ShadowRootContentScriptUiOptions,
  StopAutoMount,
} from './types';
import { logger } from '../../../sandbox/utils/logger';
import { createIsolatedElement } from '@webext-core/isolated-element';
export * from './types';

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
  let stopAutoMount: StopAutoMount | undefined = undefined;
  const mount = () => {
    applyPosition(wrapper, undefined, options);
    mountUi(wrapper, options);
    mounted = options.onMount?.(wrapper);
  };
  const autoMount = (autoMountOptions?: AutoMountOptions) => {
    if (stopAutoMount) {
      throw Error('autoMount is already set.');
    }
    stopAutoMount = autoMountUi(
      { mount, remove, mounted },
      {
        ...options,
        ...autoMountOptions,
      },
    );
    return () => {
      stopAutoMount?.();
      stopAutoMount = undefined;
    };
  };
  const remove = () => {
    options.onRemove?.(mounted);
    wrapper.remove();
    stopAutoMount?.();
    stopAutoMount = undefined;
    mounted = undefined;
  };

  ctx.onInvalidated(remove);

  return {
    get mounted() {
      return mounted;
    },
    wrapper,
    mount,
    autoMount,
    remove,
  };
}

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
  let stopAutoMount = () => {
    throw 'need implement this';
  };
  const mount = () => {
    applyPosition(wrapper, iframe, options);
    mountUi(wrapper, options);
    mounted = options.onMount?.(wrapper, iframe);
  };
  const autoMount = () => {
    // TODO: implements
    // autoMountUi();

    return stopAutoMount;
  };
  const remove = () => {
    options.onRemove?.(mounted);
    wrapper.remove();
    stopAutoMount();
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
    autoMount,
    remove,
  };
}

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

  let mounted: TMounted | undefined;
  let stopAutoMount = () => {
    throw 'need implement this';
  };
  const mount = () => {
    // Add shadow root element to DOM
    mountUi(shadowHost, options);
    applyPosition(shadowHost, shadow.querySelector('html'), options);
    // Mount UI inside shadow root
    mounted = options.onMount(uiContainer, shadow, shadowHost);
  };
  const autoMount = () => {
    // TODO: implements
    // autoMountUi();

    return stopAutoMount;
  };
  const remove = () => {
    // Cleanup mounted state
    options.onRemove?.(mounted);
    // Detatch shadow root from DOM
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
    autoMount,
    remove,
    get mounted() {
      return mounted;
    },
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

  if (typeof resolved === 'string') {
    // If the string is an XPath expression (starts with '//' or '/')
    if (resolved.startsWith('/')) {
      // Evaluate the XPath and return the first ordered node
      const result = document.evaluate(
        resolved,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      );
      return (result.singleNodeValue as Element) ?? undefined;
    } else {
      // If the string is a CSS selector, query the document and return the element
      return document.querySelector<Element>(resolved) ?? undefined;
    }
  }

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

function autoMountUi<TMounted>(
  mountContext: {
    mount: () => void;
    remove: () => void;
    mounted: TMounted | undefined;
  },
  options: ContentScriptAnchoredOptions & AutoMountOptions,
): StopAutoMount {
  const { signal, abort } = new AbortController();
  const EXPLICIT_STOP_REASON = 'explicit_stop_auto_mount';
  const stopAutoMount = () => abort(EXPLICIT_STOP_REASON);

  async function observeElement() {
    let resolvedAnchor =
      typeof options.anchor === 'function' ? options.anchor() : options.anchor;
    if (resolvedAnchor instanceof Element) {
      throw Error(
        'autoMount and Element anchor option cannot be combined. Avoid passing `Element` directly or `() => Element` to the anchor.',
      );
    }

    while (!signal.aborted) {
      try {
        const _element = await waitElement(resolvedAnchor ?? 'body', {
          customMatcher: () => getAnchor(options) ?? null,
          detector: mountContext.mounted ? removeDetector : mountDetector,
          signal: signal,
        });
        console.log('waitElement result', _element);
        if (mountContext.mounted) {
          mountContext.remove();
        } else {
          mountContext.mount();
        }
      } catch (error) {
        if (signal.aborted && signal.reason === EXPLICIT_STOP_REASON) {
          break;
        } else {
          throw error;
        }
      }
    }
  }
  observeElement();

  return stopAutoMount;
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
