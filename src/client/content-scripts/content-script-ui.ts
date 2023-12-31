import { createIsolatedElement } from '@webext-core/isolated-element';
import { browser } from '~/browser';
import { logger } from '~/sandbox/utils/logger';
import { ContentScriptContext } from './content-script-context';
import {
  ContentScriptAnchoredOptions,
  ContentScriptPositioningOptions,
  applyContentScriptUiPosition,
  mountContentScriptUiRoot,
} from '../utils/content-script-ui';

/**
 * Utility for mounting content script UI's with isolated styles and controlled event bubbling.
 * Automatically removed from the DOM when the content script's context is invalidated.
 *
 * See https://wxt.dev/guide/content-script-ui.html for full documentation.
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
 *       },
         isolateEvents: true, // or array of event names to isolate, e.g., ['click', 'keydown']
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
    isolateEvents: options.isolateEvents,
  });

  let mounted: TApp;

  const mount = () => {
    // Mount UI inside shadow root
    mounted = options.mount(uiContainer);

    // Add shadow root element to DOM
    mountContentScriptUiRoot(shadowHost, options);
    applyContentScriptUiPosition(
      shadowHost,
      shadow.querySelector('html'),
      options,
    );
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

export type ContentScriptUiOptions<TApp> = ContentScriptPositioningOptions &
  ContentScriptAnchoredOptions & {
    /**
     * The name of the custom component used to host the ShadowRoot. Must be kebab-case.
     */
    name: string;
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
     * See https://wxt.dev/guide/content-script-ui.html for more info.
     */
    css?: string;
    /**
     * Optional array of event names to prevent from bubbling up from the isolated element.
     * If true, prevents a default set of events. If array, prevents specified events.
     */
    isolateEvents?: boolean | string[];
  };
