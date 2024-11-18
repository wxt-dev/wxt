export interface IntegratedContentScriptUi<TMounted>
  extends ContentScriptUi<TMounted> {
  /**
   * A wrapper div that assists in positioning.
   */
  wrapper: HTMLElement;
}

export interface IframeContentScriptUi<TMounted>
  extends ContentScriptUi<TMounted> {
  /**
   * The iframe added to the DOM.
   */
  iframe: HTMLIFrameElement;
  /**
   * A wrapper div that assists in positioning.
   */
  wrapper: HTMLDivElement;
}

export interface ShadowRootContentScriptUi<TMounted>
  extends ContentScriptUi<TMounted> {
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
}

export interface ContentScriptUi<TMounted> {
  /**
   * Function that mounts or remounts the UI on the page.
   */
  mount: () => void;
  /**
   * Function that automatically mounts or remounts the UI in response to dynamic anchor.
   */
  autoMount: (options?: AutoMountOptions) => StopAutoMount;
  /**
   * Function that removes the UI from the webpage.
   */
  remove: () => void;
  /**>
   * Custom data returned from the `options.mount` function.
   */
  mounted: TMounted | undefined;
}

export type ContentScriptUiOptions<TMounted> = ContentScriptPositioningOptions &
  ContentScriptAnchoredOptions & {
    /**
     * Callback called before the UI is removed from the webpage. Use to cleanup your UI, like
     * unmounting your Vue or React apps.
     */
    onRemove?: (mounted: TMounted | undefined) => void;
  };

export type IntegratedContentScriptUiOptions<TMounted> =
  ContentScriptUiOptions<TMounted> & {
    /**
     * Tag used to create the wrapper element.
     *
     * @default "div"
     */
    tag?: string;
    /**
     * Callback executed when mounting the UI. This function should create and append the UI to the
     * `wrapper` element. It is called every time `ui.mount()` is called.
     *
     * Optionally return a value that can be accessed at `ui.mounted` or in the `onRemove` callback.
     */
    onMount: (wrapper: HTMLElement) => TMounted;
  };

export type IframeContentScriptUiOptions<TMounted> =
  ContentScriptUiOptions<TMounted> & {
    /**
     * The path to the HTML page that will be shown in the iframe. This string is passed into
     * `browser.runtime.getURL`.
     */
    // @ts-expect-error: HtmlPublicPath is generated per-project
    page: import('wxt/browser').HtmlPublicPath;
    /**
     * Callback executed when mounting the UI. Use this function to customize the iframe or wrapper
     * element's appearance. It is called every time `ui.mount()` is called.
     *
     * Optionally return a value that can be accessed at `ui.mounted` or in the `onRemove` callback.
     */
    onMount?: (wrapper: HTMLElement, iframe: HTMLIFrameElement) => TMounted;
  };

export type ShadowRootContentScriptUiOptions<TMounted> =
  ContentScriptUiOptions<TMounted> & {
    /**
     * The name of the custom component used to host the ShadowRoot. Must be kebab-case.
     */
    name: string;
    /**
     * Custom CSS text to apply to the UI. If your content script imports/generates CSS and you've
     * set `cssInjectionMode: "ui"`, the imported CSS will be included automatically. You do not need
     * to pass those styles in here. This is for any additional styles not in the imported CSS.
     */
    css?: string;
    /**
     * ShadowRoot's mode.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/mode
     * @default "open"
     */
    mode?: 'open' | 'closed';
    /**
     * When enabled, `event.stopPropagation` will be called on events trying to bubble out of the
     * shadow root.
     *
     * - Set to `true` to stop the propagation of a default set of events,
     *   `["keyup", "keydown", "keypress"]`
     * - Set to an array of event names to stop the propagation of a custom list of events
     */
    isolateEvents?: boolean | string[];
    /**
     * Callback executed when mounting the UI. This function should create and append the UI to the
     * `uiContainer` element. It is called every time `ui.mount()` is called.
     *
     * Optionally return a value that can be accessed at `ui.mounted` or in the `onRemove` callback.
     */
    onMount: (
      uiContainer: HTMLElement,
      shadow: ShadowRoot,
      shadowHost: HTMLElement,
    ) => TMounted;
  };

export type ContentScriptOverlayAlignment =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * ![Visualization of different append modes](https://wxt.dev/content-script-ui-append.png)
 */
export type ContentScriptAppendMode =
  | 'last'
  | 'first'
  | 'replace'
  | 'before'
  | 'after'
  | ((anchor: Element, ui: Element) => void);

export interface ContentScriptInlinePositioningOptions {
  position: 'inline';
}

export interface ContentScriptOverlayPositioningOptions {
  position: 'overlay';
  /**
   * The `z-index` used on the `wrapper` element. Set to a positive number to show your UI over website
   * content.
   */
  zIndex?: number;
  /**
   * When using `type: "overlay"`, the mounted element is 0px by 0px in size. Alignment specifies
   * which corner is aligned with that 0x0 pixel space.
   *
   * ![Visualization of alignment options](https://wxt.dev/content-script-ui-alignment.png)
   *
   * @default "top-left"
   */
  alignment?: ContentScriptOverlayAlignment;
}

export interface ContentScriptModalPositioningOptions {
  position: 'modal';
  /**
   * The `z-index` used on the `shadowHost`. Set to a positive number to show your UI over website
   * content.
   */
  zIndex?: number;
}

/**
 * Choose between `"inline"`, `"overlay"`, or `"modal"` positions.
 *
 * ![Visualization of different types](https://wxt.dev/content-script-ui-position.png)
 */
export type ContentScriptPositioningOptions =
  | ContentScriptInlinePositioningOptions
  | ContentScriptOverlayPositioningOptions
  | ContentScriptModalPositioningOptions;

export interface ContentScriptAnchoredOptions {
  /**
   * A CSS selector, XPath expression, element, or function that returns one of the three. Along with `append`, the
   * `anchor` dictates where in the page the UI will be added.
   */
  anchor?:
    | string
    | Element
    | null
    | undefined
    | (() => string | Element | null | undefined);
  /**
   * In combination with `anchor`, decide how to add the UI to the DOM.
   *
   * - `"last"` (default) - Add the UI as the last child of the `anchor` element
   * - `"first"` - Add the UI as the first child of the `anchor` element
   * - `"replace"` - Replace the `anchor` element with the UI.
   * - `"before"` - Add the UI as the sibling before the `anchor` element
   * - `"after"` - Add the UI as the sibling after the `anchor` element
   * - `(anchor, ui) => void` - Customizable function that let's you add the UI to the DOM
   */
  append?: ContentScriptAppendMode | ((anchor: Element, ui: Element) => void);
}

export type AutoMountOptions = { once?: boolean };
export type StopAutoMount = () => void;
