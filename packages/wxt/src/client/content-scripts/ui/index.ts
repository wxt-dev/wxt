import { browser } from 'wxt/browser';
import { waitElement } from '@1natsu/wait-element';
import {
  isExist as mountDetector,
  isNotExist as removeDetector,
} from '@1natsu/wait-element/detectors';
import { ContentScriptContext } from '..';
import {
  AutoMount,
  AutoMountOptions,
  BaseMountFunctions,
  ContentScriptAnchoredOptions,
  ContentScriptPositioningOptions,
  ContentScriptUiOptions,
  IframeContentScriptUi,
  IframeContentScriptUiOptions,
  IntegratedContentScriptUi,
  IntegratedContentScriptUiOptions,
  MountFunctions,
  ShadowRootContentScriptUi,
  ShadowRootContentScriptUiOptions,
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
    iframe,
    wrapper,
    ...mountFunctions,
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
    // Detatch shadow root from DOM
    shadowHost.remove();
    // Remove children from uiContainer
    while (uiContainer.lastChild)
      uiContainer.removeChild(uiContainer.lastChild);
    // Clear mounted value
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
    shadow,
    shadowHost,
    uiContainer,
    ...mountFunctions,
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

function createMountFunctions<TMounted>(
  baseFunctions: BaseMountFunctions,
  options: ContentScriptUiOptions<TMounted>,
): MountFunctions {
  let autoMountInstance: AutoMount | undefined = undefined;

  const stopAutoMount = () => {
    autoMountInstance?.stopAutoMount();
    autoMountInstance = undefined;
  };

  const mount = () => {
    baseFunctions.mount();
  };

  const unmount = baseFunctions.remove;

  const remove = () => {
    stopAutoMount();
    baseFunctions.remove();
  };

  const autoMount = (autoMountOptions?: AutoMountOptions) => {
    if (autoMountInstance) {
      logger.warn('autoMount is already set.');
      return stopAutoMount;
    }
    autoMountInstance = autoMountUi(
      { mount, unmount, stopAutoMount },
      {
        ...options,
        ...autoMountOptions,
      },
    );
    return stopAutoMount;
  };

  return {
    mount,
    remove,
    autoMount,
  };
}

function autoMountUi(
  uiCallbacks: {
    mount: () => void;
    unmount: () => void;
    stopAutoMount: () => void;
  },
  options: ContentScriptAnchoredOptions & AutoMountOptions,
): AutoMount {
  const abortController = new AbortController();
  const EXPLICIT_STOP_REASON = 'explicit_stop_auto_mount';
  const _stopAutoMount = () => {
    abortController.abort(EXPLICIT_STOP_REASON);
    options.onStop?.();
  };

  let resolvedAnchor =
    typeof options.anchor === 'function' ? options.anchor() : options.anchor;
  if (resolvedAnchor instanceof Element) {
    throw Error(
      'autoMount and Element anchor option cannot be combined. Avoid passing `Element` directly or `() => Element` to the anchor.',
    );
  }

  async function observeElement(selector: string | null | undefined) {
    let isAnchorExist = !!getAnchor(options);

    while (!abortController.signal.aborted) {
      try {
        const changedAnchor = await waitElement(selector ?? 'body', {
          customMatcher: () => getAnchor(options) ?? null,
          detector: isAnchorExist ? removeDetector : mountDetector,
          signal: abortController.signal,
        });
        isAnchorExist = !!changedAnchor;
        if (isAnchorExist) {
          uiCallbacks.mount();
        } else {
          uiCallbacks.unmount();
          if (options.once) {
            uiCallbacks.stopAutoMount();
          }
        }
      } catch (error) {
        if (
          abortController.signal.aborted &&
          abortController.signal.reason === EXPLICIT_STOP_REASON
        ) {
          break;
        } else {
          throw error;
        }
      }
    }
  }
  observeElement(resolvedAnchor);

  return { stopAutoMount: _stopAutoMount };
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
