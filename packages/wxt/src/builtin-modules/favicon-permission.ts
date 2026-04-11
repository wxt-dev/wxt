import { defineWxtModule } from '../modules';
import type { WxtDirFileEntry } from '../types';

/**
 * Adds a template-literal type for the `_favicon/` paths served by Chrome's
 * favicon API when the `favicon` permission is declared. With this module,
 * `browser.runtime.getURL('/_favicon/?pageUrl=...')` type-checks without
 * needing a `@ts-expect-error`.
 *
 * The favicon API is Chromium-only — Firefox does not serve `_favicon/` URLs,
 * so the type augmentation is skipped there to avoid suggesting a path that
 * will 404 at runtime.
 *
 * Extensions that load favicons from a content script must still add their own
 * `web_accessible_resources` entry — this module intentionally does not touch
 * the manifest. See the review thread on #1570 for context.
 *
 * @see https://developer.chrome.com/docs/extensions/how-to/ui/favicons
 */
export default defineWxtModule({
  name: 'wxt:built-in:favicon-permission',
  setup(wxt) {
    wxt.hooks.hook('prepare:types', (_, entries) => {
      // Firefox has no equivalent favicon API, so the `/_favicon/${string}`
      // path would not resolve at runtime — don't suggest it via types.
      if (wxt.config.browser === 'firefox') return;
      if (!wxt.config.manifest.permissions?.includes('favicon')) return;

      const pathsEntry = entries.find(
        (entry): entry is WxtDirFileEntry =>
          'path' in entry && entry.path === 'types/paths.d.ts',
      );
      if (!pathsEntry) return;

      // The base generator wraps every public path in double quotes,
      // producing string-literal union members. Favicon URLs need a
      // template-literal type so arbitrary query strings type-check, so
      // we splice a `\`/_favicon/\${string}\`` member into the union
      // directly. The `HtmlPublicPath` line is a stable anchor emitted
      // by generate-wxt-dir.ts:getPathsDeclarationEntry.
      const anchor = '  type HtmlPublicPath';
      pathsEntry.text = pathsEntry.text.replace(
        anchor,
        '    | `/_favicon/${string}`\n' + anchor,
      );
    });
  },
});
