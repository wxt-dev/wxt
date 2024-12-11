import type {
  ContentScriptAnchoredOptions,
  ContentScriptPositioningOptions,
} from './types';

export function applyPosition(
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

export function getAnchor(
  options: ContentScriptAnchoredOptions,
): Element | undefined {
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

export function mountUi(
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
