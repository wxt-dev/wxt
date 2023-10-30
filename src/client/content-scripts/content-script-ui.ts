import { createIsolatedElement } from '@webext-core/isolated-element';
import { browser } from '~/browser';
import { logger } from '~/client/utils/logger';
import { ContentScriptContext } from './content-script-context';

/**
 * Utility for mounting content script UI's with isolated styles. Automatically removed from the DOM
 * when the content script's context is invalidated.
 *
 * See https://wxt.dev/entrypoints/content-scripts.html#ui for full documentation.
 *
 * @example
 * // entrypoints/example-ui.content/index.ts
 * import "./style.css"
 *
 * export default defineContentScript({
 *   matches: ["*://*.google.com/*"],
 *   cssInjectionMode: "ui",
 *
 *   async main(ctx) {
 *     const ui = await createContentScriptUi(ctx, {
 *       name: "example-overlay",
 *       type: "modal",
 *       mount(container) {
 *         const app = document.createElement("div");
 *         app.textContent = "Content Script UI";
 *         container.append(app);
 *       }
 *     })
 *     ui.mount();
 *   }
 * })
 */
export async function createContentScriptUi<TApp>(
  ctx: ContentScriptContext,
  options: ContentScriptUiOptions<TApp>,
): Promise<ContentScriptUi<TApp>> {
  const css = [options.css ?? ''];
  if (ctx.options?.cssInjectionMode === 'ui') {
    css.push(await loadCss());
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

  let mounted: TApp;

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
async function loadCss(): Promise<string> {
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

export interface ContentScriptUi<TApp> {
  /**
   * The `HTMLElement` hosting the shadow root used to isolate the UI's styles. This is the element
   * that get's added to the DOM. This element's style is not isolated from the webpage.
   */
  shadowHost: HTMLElement;
  /**
   * The container element inside the `ShadowRoot` whose styles are isolated. The UI is mounted
   * inside this `HTMLElement`.
   */
  uiContainer: HTMLElement;
  /**
   * The shadow root performing the isolation.
   */
  shadow: ShadowRoot;
  /**
   * Custom data returned from the `options.mount` function.
   */
  mounted: TApp;
  /**
   * Function that mounts or remounts the UI on the page.
   */
  mount: () => void;
  /**
   * Function that removes the UI from the webpage.
   */
  remove: () => void;
}

export interface BaseContentScriptUiOptions<TApp> {
  /**
   * The name of the custom component used to host the ShadowRoot. Must be kebab-case.
   */
  name: string;
  /**
   * In combination with `anchor`, decide how to add the UI to the DOM.
   *
   * - `"last"` (default) - Add the UI as the last child of the `anchor` element
   * - `"first"` - Add the UI as the last child of the `anchor` element
   * - `"replace"` - Replace the `anchor` element with the UI.
   * - `"before"` - Add the UI as the sibling before the `anchor` element
   * - `"after"` - Add the UI as the sibling after the `anchor` element
   * - `(anchor, ui) => void` - Customizable function that let's you add the UI to the DOM
   */
  append?: ContentScriptAppendMode | ((anchor: Element, ui: Element) => void);
  /**
   * A CSS selector, element, or function that returns one of the two. Along with `append`, the
   * `anchor` dictates where in the page the UI will be added.
   */
  anchor?:
    | string
    | Element
    | null
    | undefined
    | (() => string | Element | null | undefined);
  /**
   * Callback executed when mounting the UI. This function should create and append the UI to the
   * `container` element. It is called every time `ui.mount()` is called
   *
   * Optionally return a value that can be accessed at `ui.mounted` or in the `onRemove` callback.
   */
  mount: (container: Element) => TApp;
  /**
   * Callback called when the UI is removed from the webpage. Use to cleanup your UI, like
   * unmounting your vue or react apps.
   */
  onRemove?: (mounted: TApp) => void;
  /**
   * Custom CSS text to apply to the UI. If your content script imports/generates CSS and you've
   * set `cssInjectionMode: "ui"`, the imported CSS will be included automatically. You do not need
   * to pass those styles in here. This is for any additional styles not in the imported CSS.
   *
   * See https://wxt.dev/entrypoints/content-scripts.html#ui for more info.
   */
  css?: string;
}

export type OverlayContentScriptUiOptions<TApp> =
  BaseContentScriptUiOptions<TApp> & {
    type: 'overlay';
    /**
     * When using `type: "overlay"`, the mounted element is 0px by 0px in size. Alignment specifies
     * which corner is aligned with that 0x0 pixel space.
     *
     * @default "top-left"
     */
    alignment?: ContentScriptUiOverlayAlignment;
    /**
     * The `z-index` used on the `shadowHost`. Set to a positive number to show your UI over website
     * content.
     */
    zIndex?: number;
  };

export type ModalContentScriptUiOptions<TApp> =
  BaseContentScriptUiOptions<TApp> & {
    type: 'modal';
    /**
     * The `z-index` used on the `shadowHost`. Set to a positive number to show your UI over website
     * content.
     */
    zIndex?: number;
  };

export type InlineContentScriptUiOptions<TApp> =
  BaseContentScriptUiOptions<TApp> & {
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

export type ContentScriptUiOptions<TApp> =
  | OverlayContentScriptUiOptions<TApp>
  | ModalContentScriptUiOptions<TApp>
  | InlineContentScriptUiOptions<TApp>;
