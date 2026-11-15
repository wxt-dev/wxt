import { DOMParser } from '@litejs/dom';

/** Parse an HTML string into a document. */
export function parseHTML(html: string): { document: Document } {
  const document = new DOMParser().parseFromString(
    html,
    'text/html',
  ) as unknown as Document;
  if (!(document as Document).head) {
    // @litejs/dom doesn't implement `document.head`, so find or create it.
    Object.defineProperty(document, 'head', {
      get() {
        let head = document.querySelector('head');
        if (head) return head;
        head = document.createElement('head');
        const root = document.documentElement;
        root.insertBefore(head, root.firstChild);
        return head;
      },
    });
  }
  return { document };
}
