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
export * from './types';

/**
 * Create a content script UI without any isolation.
 *
 * @see https://wxt.dev/guide/content-script-ui.html#integrated
 */
export function createContentScriptUi<TApp>(
  ctx: ContentScriptContext,
  options: IntegratedContentScriptUiOptions<TApp>,
): IntegratedContentScriptUi<TApp>;
/**
 * Create a content script UI inside an iframe.
 *
 * @see https://wxt.dev/guide/content-script-ui.html#iframe
 */
export function createContentScriptUi<TApp>(
  ctx: ContentScriptContext,
  options: IframeContentScriptUiOptions<TApp>,
): IframeContentScriptUi<TApp>;
/**
 * Create a content script UI inside a [`ShadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot).
 *
 * @see https://wxt.dev/guide/content-script-ui.html#shadowroot
 */
export function createContentScriptUi<TApp>(
  ctx: ContentScriptContext,
  options: ShadowRootContentScriptUiOptions<TApp>,
): ShadowRootContentScriptUi<TApp>;
export function createContentScriptUi<TApp>(
  ctx: ContentScriptContext,
  options:
    | IntegratedContentScriptUiOptions<TApp>
    | IframeContentScriptUiOptions<TApp>
    | ShadowRootContentScriptUiOptions<TApp>,
):
  | IntegratedContentScriptUi<TApp>
  | IframeContentScriptUi<TApp>
  | ShadowRootContentScriptUi<TApp> {
  throw Error('Not implemented');
}

function applyPosition(
  root: HTMLElement,
  positionedElement: HTMLElement | undefined | null,
  options: ContentScriptPositioningOptions,
): void {
  if (options.type !== 'inline') {
    if (options.zIndex != null) root.style.zIndex = String(options.zIndex);

    root.style.overflow = 'visible';
    root.style.position = 'relative';
    root.style.width = '0';
    root.style.height = '0';
    root.style.display = 'block';

    if (positionedElement) {
      if (options.type === 'overlay') {
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
}

function getAnchor(options: ContentScriptAnchoredOptions): Element | undefined {
  if (options.anchor == null) return document.body;

  let resolved =
    typeof options.anchor === 'function' ? options.anchor() : options.anchor;
  if (typeof resolved === 'string')
    return document.querySelector<Element>(resolved) ?? undefined;
  return resolved ?? undefined;
}
