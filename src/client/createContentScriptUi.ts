import { createIsolatedElement } from '@webext-core/isolated-element';
import { browser } from './browser';
import { logger } from './utils/logger';
import { ContentScriptContext } from '.';

// TODO: Add docs
export async function createContentScriptUi<T>(
  ctx: ContentScriptContext,
  options: ContentScriptUiOptions<T>,
): Promise<ContentScriptUi<T>> {
  const {
    isolatedElement: uiContainer,
    parentElement: shadowHost,
    shadow,
  } = await createIsolatedElement({
    name: options.name,
    css: {
      textContent: `${options.css ?? ''}\n${await loadCss()}`.trim(),
    },
    mode: 'open',
  });

  const getAnchor = (): Element | undefined => {
    if (options.anchor == null) return document.body;

    let resolved =
      typeof options.anchor === 'function' ? options.anchor() : options.anchor;
    if (typeof resolved === 'string')
      return document.querySelector<Element>(resolved) ?? undefined;
    return resolved ?? undefined;
  };

  let mounted: T;

  const mount = () => {
    const anchor = getAnchor();
    if (anchor == null)
      throw Error(
        'Failed to mount content script ui: could not find anchor element',
      );

    // Mount UI inside shadow root
    mounted = options.mount(uiContainer);

    // Add shadow root element to DOM
    switch (options.append) {
      case undefined:
      case 'last':
        anchor.append(shadowHost);
        break;
      case 'first':
        if (anchor.firstChild) {
          anchor.insertBefore(shadowHost, anchor.firstChild);
        } else {
          anchor.append(shadowHost);
        }
        break;
      case 'replace':
        anchor.replaceWith(shadowHost);
        break;
      case 'after':
        anchor.replaceWith(anchor, shadowHost);
        break;
      case 'before':
        anchor.replaceWith(shadowHost, anchor);
        break;
      default:
        options.append(anchor, shadowHost);
        break;
    }

    // Apply types
    if (options.type !== 'inline') {
      if (options.zIndex != null)
        shadowHost.style.zIndex = String(options.zIndex);

      shadowHost.style.overflow = 'visible';
      shadowHost.style.position = 'relative';
      shadowHost.style.width = '0';
      shadowHost.style.height = '0';
      shadowHost.style.display = 'block';

      const html = shadow.querySelector('html')!;
      // HTML doesn't exist in tests
      if (options.type === 'overlay') {
        html.style.position = 'absolute';
        if (options.alignment?.startsWith('bottom-')) html.style.bottom = '0';
        else html.style.top = '0';

        if (options.alignment?.endsWith('-right')) html.style.right = '0';
        else html.style.left = '0';
      } else {
        html.style.position = 'fixed';
        html.style.top = '0';
        html.style.bottom = '0';
        html.style.left = '0';
        html.style.right = '0';
      }
    }
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

/**
 * Load the CSS for the current entrypoint.
 */
export async function loadCss(): Promise<string> {
  const url = browser.runtime.getURL(`/content-scripts/${__ENTRYPOINT__}.css`);
  try {
    const res = await fetch(url);
    const css = await res.text();

    // Replace :root selectors with :host since we're in a shadow root
    return css.replaceAll(':root', ':host');
  } catch (err) {
    logger.warn(
      `Failed to load styles @ ${url}. Did you forget to import the stylesheet in your entrypoint?`,
      err,
    );
    return '';
  }
}

export interface ContentScriptUi<T> {
  shadowHost: HTMLElement;
  uiContainer: HTMLElement;
  shadow: ShadowRoot;
  mounted: T;
  mount: () => void;
  remove: () => void;
}

interface BaseContentScriptUiOptions<T> {
  name: string;
  append?: ContentScriptAppendMode | ((anchor: Element, ui: Element) => void);
  anchor?:
    | string
    | Element
    | null
    | undefined
    | (() => string | Element | null | undefined);
  mount: (container: Element) => T;
  onRemove?: (mounted: T) => void;
  css?: string;
}

export type OverlayContentScriptUiOptions<T> = BaseContentScriptUiOptions<T> & {
  type: 'overlay';
  alignment?: ContentScriptUiOverlayAlignment;
  zIndex?: number;
};

export type ModalContentScriptUiOptions<T> = BaseContentScriptUiOptions<T> & {
  type: 'modal';
  zIndex?: number;
};

export type InlineContentScriptUiOptions<T> = BaseContentScriptUiOptions<T> & {
  type: 'inline';
};

export type ContentScriptUiOverlayAlignment =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type ContentScriptAppendMode =
  | 'last'
  | 'first'
  | 'replace'
  | 'before'
  | 'after';

export type ContentScriptUiOptions<T> =
  | OverlayContentScriptUiOptions<T>
  | ModalContentScriptUiOptions<T>
  | InlineContentScriptUiOptions<T>;
